import { createClient } from '@supabase/supabase-js'
console.log("📢 ENV KEYS RAW:", import.meta.env);

console.log("📢 ENV CONTENTS:", import.meta.env);
console.log("📢 SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("📢 SUPABASE ANON KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log("📢 SUPABASE SERVICE ROLE KEY:", import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
console.log("📢 VITE_SOME_KEY =", import.meta.env.VITE_SOME_KEY)
if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error("❌ VITE_SUPABASE_URL nije definisan u .env");
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error("❌ VITE_SUPABASE_ANON_KEY nije definisan u .env");
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: { storageKey: 'vrticko-regular-client' },
  }
)

export const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      storageKey: 'vrticko-admin-client',
      detectSessionInUrl: false,
    },
  }
)
