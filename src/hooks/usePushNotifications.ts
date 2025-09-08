import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

interface CustomPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

let globalNotificationId: string | null = null;

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<CustomPushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // check support
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const registerServiceWorker = useCallback(async () => {
    return await navigator.serviceWorker.register("/sw.js");
  }, []);

  const requestPermission = useCallback(async () => {
    const perm = await Notification.requestPermission();
    setPermission(perm);
    return perm === "granted";
  }, []);

  const createSubscription = useCallback(async (): Promise<CustomPushSubscription | null> => {
    try {
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      console.log("📢 VAPID key from env:", vapidPublicKey);

      if (!vapidPublicKey) {
        console.error("❌ Nema VAPID public key u env varijablama");
        return null;
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      return {
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(sub.getKey("p256dh")!),
          auth: arrayBufferToBase64(sub.getKey("auth")!),
        },
      };
    } catch (err) {
      console.error("❌ Greška pri kreiranju subscription-a:", err);
      return null;
    }
  }, []);

  const saveSubscription = useCallback(async (pushSubscription: CustomPushSubscription | null) => {
    if (!pushSubscription) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: pushSubscription.endpoint,
          p256dh_key: pushSubscription.keys.p256dh,
          auth_key: pushSubscription.keys.auth,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      );

      if (error) {
        console.error("❌ Error saving subscription:", error);
      } else {
        console.log("✅ Subscription saved successfully");
      }
    } catch (err) {
      console.error("❌ Exception saving subscription:", err);
    }
  }, []);

  /**
   * Realtime kanal – koristi se samo za refresh UI-a (ne prikazuje notifikacije).
   */
  const setupRealtimeNotifications = useCallback(() => {
    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        const n = payload.new;
        if (n && n.id !== globalNotificationId) {
          globalNotificationId = n.id;
          console.log("🔔 Nova notifikacija kroz realtime:", n);
          // 👉 ovde osveži state/listu obaveštenja u app-u
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const initializePushNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!isSupported) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // skip push za admina → koristi samo realtime
      const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (profile?.role === "admin") {
        console.log("👮 Admin – preskačem push subscription, koristim samo realtime");
        setupRealtimeNotifications();
        return;
      }

      const registration = await registerServiceWorker();

      if (Notification.permission !== "granted") {
        const granted = await requestPermission();
        if (!granted) return;
      }

      const existing = await registration.pushManager.getSubscription();
      let pushSub: CustomPushSubscription | null = null;

      if (existing) {
        pushSub = {
          endpoint: existing.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(existing.getKey("p256dh")!),
            auth: arrayBufferToBase64(existing.getKey("auth")!),
          },
        };
      } else {
        pushSub = await createSubscription();
      }

      if (pushSub) {
        setSubscription(pushSub);
        await saveSubscription(pushSub);
      }

      setupRealtimeNotifications();
    } catch (err) {
      console.error("❌ Greška pri inicijalizaciji:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, registerServiceWorker, requestPermission, createSubscription, saveSubscription, setupRealtimeNotifications]);

  // auto init on auth change
  useEffect(() => {
    let cleanupRealtime: (() => void) | null = null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        initializePushNotifications().then((res) => {
          cleanupRealtime = res as unknown as (() => void) | null;
        });
      }
      if (event === "SIGNED_OUT") {
        if (cleanupRealtime) cleanupRealtime();
      }
    });

    return () => {
      subscription.unsubscribe();
      if (cleanupRealtime) cleanupRealtime();
    };
  }, [initializePushNotifications]);

  const testNotification = useCallback(async () => {
    if (!subscription) {
      throw new Error('No subscription available');
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: user.id,
          title: 'Test Notifikacija',
          message: 'Ovo je test notifikacija!',
          icon: '/vite.svg'
        }
      });

      if (error) throw error;
    } catch (err) {
      console.error('❌ Error sending test notification:', err);
      throw err;
    }
  }, [subscription]);

  const removeSubscription = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Remove from database
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Error removing subscription:', error);
      }

      // Unsubscribe from push manager
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
      }

      setSubscription(null);
      console.log('✅ Subscription removed successfully');
    } catch (err) {
      console.error('❌ Error removing subscription:', err);
      throw err;
    }
  }, []);

  return {
    isSupported,
    permission,
    subscription,
    isLoading,
    initializePushNotifications,
    setupRealtimeNotifications,
    testNotification,
    removeSubscription,
  };
};
