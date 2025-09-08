import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  "Access-Control-Max-Age": "86400"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Skip auth check for admin operations
    // In production, you might want to add proper admin authentication
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // First delete any children associated with this user
    const { error: childrenError } = await supabase
      .from('children')
      .delete()
      .eq('parent_id', userId);

    if (childrenError) {
      console.warn('Error deleting children:', childrenError);
      // Continue with user deletion even if children deletion fails
    }

    // Try to delete auth user if it exists
    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError && !authError.message.includes('User not found')) {
        console.warn('Auth user deletion failed:', authError);
        // Continue with profile deletion
      }
    } catch (authError) {
      console.log('Auth user not found or already deleted');
    }

    // Delete user profile
    const { error: profileError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (profileError) throw profileError;

    return new Response(
      JSON.stringify({
        success: true,
        message: "User deleted successfully"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error deleting user:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
