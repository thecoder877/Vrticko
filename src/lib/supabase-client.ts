import { createClient } from '@supabase/supabase-js'

// Uzmi iz Vite env-a, očisti razmake i skini završni /
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/$/, '')
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Ovo puca rano i jasno u build/runtime ako env nije dobar
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: { 'x-client-info': 'vrticko-web' },
  },
})

// Pomoćni log (samo u browseru, i samo jednom)
if (typeof window !== 'undefined' && !(window as any).__VRT_SUPABASE_LOGGED__) {
  console.log('[VRTICKO] Supabase URL:', SUPABASE_URL)
  ;(window as any).__VRT_SUPABASE_LOGGED__ = true
}
