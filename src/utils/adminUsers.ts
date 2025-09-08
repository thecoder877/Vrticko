// Hot-fix: eksplicitno gađamo Supabase Functions endpoint, nikad Vercel domen.
// Ako negde ostane stari kod, ovaj util i dalje garantuje pravi URL.

export async function createUserAdmin(params: {
    email: string
    password: string
    username: string
    role: 'admin' | 'teacher' | 'parent'
    full_name?: string
  }) {
    const base = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '')
    if (!base) throw new Error('VITE_SUPABASE_URL is missing')
  
    const endpoint = `${base}/functions/v1/admin-create-user`
    console.log('[admin-create-user] endpoint =', endpoint)
  
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY!}`,
      },
      body: JSON.stringify(params),
    })
  
    let data: any = null
    try { data = await resp.json() } catch { /* prazno telo */ }
  
    if (!resp.ok) {
      throw new Error(data?.error || `HTTP ${resp.status} ${resp.statusText}`)
    }
    if (data?.error) throw new Error(data.error)
    return data
  }
  
  export async function deleteUserAdmin(userId: string) {
    const base = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '')
    if (!base) throw new Error('VITE_SUPABASE_URL is missing')
  
    const endpoint = `${base}/functions/v1/admin-delete-user`
    console.log('[admin-delete-user] endpoint =', endpoint)
  
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY!}`,
      },
      body: JSON.stringify({ userId }),
    })
  
    let data: any = null
    try { data = await resp.json() } catch {}
  
    if (!resp.ok) {
      throw new Error(data?.error || `HTTP ${resp.status} ${resp.statusText}`)
    }
    if (data?.error) throw new Error(data.error)
    return data
  }
  