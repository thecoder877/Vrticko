import { supabase } from '../lib/supabase'

export async function createUserAdmin(params: {
  email: string
  password: string
  username: string
  role: 'admin' | 'teacher' | 'parent'
  full_name?: string
}) {
  const { data, error } = await supabase.functions.invoke('admin-create-user', {
    body: params,
  })

  if (error) {
    const raw = (error as any)?.context?.response
      ? await (error as any).context.response.text()
      : ''
    throw new Error((data as any)?.error || error.message || raw || 'Unknown error')
  }
  if ((data as any)?.error) {
    throw new Error((data as any).error)
  }
  return data
}

export async function deleteUserAdmin(userId: string) {
  const { data, error } = await supabase.functions.invoke('admin-delete-user', {
    body: { userId },
  })

  if (error) {
    const raw = (error as any)?.context?.response
      ? await (error as any).context.response.text()
      : ''
    throw new Error((data as any)?.error || error.message || raw || 'Unknown error')
  }
  if ((data as any)?.error) {
    throw new Error((data as any).error)
  }
  return data
}
