import { supabase } from '../lib/supabase'

// Debug utility to expose React context and Supabase client globally
export const exposeToGlobal = (React: any) => {
  if (typeof window !== 'undefined') {
    // Expose React
    ;(window as any).React = React
    
    // Expose Supabase client
    ;(window as any).supabase = supabase
    
    console.log('Debug utilities exposed to window object:')
    console.log('- window.React: React library')
    console.log('- window.supabase: Supabase client')
  }
}

// Function to get current auth context (if available)
export const getAuthContext = () => {
  if (typeof window !== 'undefined' && (window as any).authContext) {
    return (window as any).authContext
  }
  return null
}

// Function to test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error) {
      console.error('Supabase connection test failed:', error)
      return false
    }
    console.log('Supabase connection test successful')
    return true
  } catch (error) {
    console.error('Supabase connection test error:', error)
    return false
  }
}

// Function to get current user info
export const getCurrentUserInfo = () => {
  const authContext = getAuthContext()
  if (authContext) {
    console.log('Current user info:', {
      user: authContext.user,
      loading: authContext.loading
    })
    return authContext.user
  }
  console.log('No auth context available')
  return null
}
