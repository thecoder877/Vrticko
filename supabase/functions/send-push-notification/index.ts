import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as webpush from "npm:web-push@3.6.7";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  "Access-Control-Max-Age": "86400"
};
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    // VAPID keys
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidEmail = "mailto:noreply@vrticko.com";
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("❌ Missing VAPID keys");
      return new Response(JSON.stringify({
        error: "Server misconfiguration: missing VAPID keys"
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    // Parse request
    const requestBody = await req.json();
    const { title, body, message, icon, badge, data, userId, target } = requestBody;
    if (!title || !(body || message)) {
      return new Response(JSON.stringify({
        error: "Title and message are required"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Fetch subscriptions
    let subscriptions = [];
    if (userId) {
      const { data: userSubs, error } = await supabaseClient.from("push_subscriptions").select("endpoint, p256dh_key, auth_key, user_id").eq("user_id", userId);
      if (error) throw error;
      subscriptions = userSubs || [];
    } else if (target) {
      const roles = target === "all" ? [
        "parent",
        "teacher",
        "admin"
      ] : [
        target.replace("s", "")
      ];
      const { data: users, error: usersError } = await supabaseClient.from("users").select("id").in("role", roles);
      if (usersError) throw usersError;
      const userIds = users?.map((u)=>u.id) || [];
      if (userIds.length > 0) {
        const { data: roleSubs, error: roleError } = await supabaseClient.from("push_subscriptions").select("endpoint, p256dh_key, auth_key, user_id").in("user_id", userIds);
        if (roleError) throw roleError;
        subscriptions = roleSubs || [];
      }
    } else {
      const { data: allSubs, error: allError } = await supabaseClient.from("push_subscriptions").select("endpoint, p256dh_key, auth_key, user_id");
      if (allError) throw allError;
      subscriptions = allSubs || [];
    }
    if (subscriptions.length === 0) {
      return new Response(JSON.stringify({
        message: "No subscriptions found",
        sent: 0
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // ✅ Prevent duplicate notifications (same title+message in last 30s)
    const { data: recent } = await supabaseClient.from("notifications").select("id, created_at").eq("title", title).eq("message", message || body).order("created_at", {
      ascending: false
    }).limit(1);
    let notification;
    if (recent && recent.length > 0) {
      const createdAt = new Date(recent[0].created_at).getTime();
      const now = Date.now();
      if (now - createdAt < 30_000) {
        console.log("⚠️ Duplicate notification detected, skipping insert");
        notification = recent[0];
      }
    }
    if (!notification) {
      const { data: inserted, error: notifError } = await supabaseClient.from("notifications").insert({
        title,
        message: message || body,
        target: target || "all",
        created_by: userId || null,
        created_at: new Date().toISOString()
      }).select().single();
      if (notifError) throw notifError;
      notification = inserted;
    }
    // Setup web-push
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
    // Send push
    const results = await Promise.allSettled(subscriptions.map(async (sub)=>{
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key
          }
        };
        const payload = JSON.stringify({
          data: {
            title,
            message: message || body,
            icon: icon || "/icon-192x192.png",
            badge: badge || "/badge-72x72.png",
            notificationId: notification.id,
            url: "/notifications",
            ...data
          }
        });
        await webpush.sendNotification(pushSubscription, payload);
        return {
          success: true,
          userId: sub.user_id
        };
      } catch (error) {
        console.error(`❌ Failed push for ${sub.user_id}:`, error);
        if (error.statusCode === 404 || error.statusCode === 410) {
          await supabaseClient.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          console.log(`🗑️ Deleted expired subscription for ${sub.user_id}`);
        }
        return {
          success: false,
          userId: sub.user_id,
          error: error.message
        };
      }
    }));
    const successful = results.filter((r)=>r.status === "fulfilled" && r.value.success).length;
    const failed = results.length - successful;
    return new Response(JSON.stringify({
      message: "Notification created and sent",
      notification,
      total: subscriptions.length,
      successful,
      failed,
      results: results.map((r)=>r.status === "fulfilled" ? r.value : {
          error: r.reason
        })
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("❌ Error in send-push-notification:", error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
