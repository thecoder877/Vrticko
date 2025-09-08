import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, type User } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  supabaseUser: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProfileCache, setUserProfileCache] = useState<Map<string, User>>(new Map())
  const [, setFetchingUsers] = useState<Set<string>>(new Set())
  const [fetchPromises, setFetchPromises] = useState<Map<string, Promise<void>>>(new Map())

  useEffect(() => {
    let isMounted = true

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isMounted) {
        console.log('Auth loading timeout - setting loading to false')
        setLoading(false)
      }
    }, 3000) // 3 second timeout - brži timeout

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }: { data: { session: any }, error: any }) => {
      if (!isMounted) return
      
      clearTimeout(timeout)
      
      if (error) {
        console.error('Error getting session:', error)
        setLoading(false)
        return
      }
      
      setSupabaseUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }).catch((error: any) => {
      if (!isMounted) return
      clearTimeout(timeout)
      console.error('Error in getSession:', error)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (!isMounted) return
      
      clearTimeout(timeout)
      
      console.log('Auth state changed:', event, session?.user?.id)
      
      setSupabaseUser(session?.user ?? null)
      if (session?.user) {
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed, keeping user logged in')
          // Ne menjaj user state kada se token refresh-uje
          return
        }
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setUserProfileCache(new Map())
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string, retryCount = 0): Promise<void> => {
    try {
      console.log('Fetching user profile for:', userId, retryCount > 0 ? `(retry ${retryCount})` : '')
      
      // Check cache first
      if (userProfileCache.has(userId) && retryCount === 0) {
        console.log('Using cached user profile')
        setUser(userProfileCache.get(userId)!)
        setLoading(false)
        return
      }

      // Check if there's already a promise for this user
      if (fetchPromises.has(userId)) {
        console.log('Already fetching user profile for:', userId, '- waiting for existing promise')
        await fetchPromises.get(userId)
        return
      }

      // Create a new promise for this user
      const fetchPromise = (async () => {
        setFetchingUsers(prev => new Set(prev).add(userId))
        
        // Add timeout to the database request
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database request timeout')), 1000)
        )
        
        const dbPromise = supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        const { data, error } = await Promise.race([dbPromise, timeoutPromise]) as any

        if (error) {
          console.error('Error fetching user profile:', error)
          
          // Handle timeout specifically
          if (error.message === 'Database request timeout') {
            console.warn('Database timeout - using cached data or default profile')
            // Return a default profile for timeout cases
            return {
              id: userId,
              username: 'User',
              role: 'user',
              created_at: new Date().toISOString(),
              email: 'unknown@example.com'
            }
          }
          
          // If user profile doesn't exist, create a default one
          if (error.code === 'PGRST116') {
            console.log('User profile not found, creating default profile')
            const { data: newUser, error: insertError } = await supabase
              .from('users')
              .insert({
                id: userId,
                username: 'New User',
                role: 'parent'
              })
              .select()
              .single()
            
            if (insertError) {
              console.error('Error creating user profile:', insertError)
              setUser(null)
            } else {
              console.log('Created new user profile:', newUser)
              setUser(newUser)
              // Cache the new user
              setUserProfileCache(prev => new Map(prev).set(userId, newUser))
            }
          } else {
            setUser(null)
          }
        } else {
          console.log('Found user profile:', data)
          setUser(data)
          // Cache the user profile
          setUserProfileCache(prev => new Map(prev).set(userId, data))
        }
      })()

      // Store the promise
      setFetchPromises(prev => new Map(prev).set(userId, fetchPromise.then(() => {})))

      try {
        await fetchPromise
      } catch (error) {
        console.error('Error in fetchUserProfile:', error)
        
        // Retry logic for timeout errors
        if (error instanceof Error && error.message.includes('timeout') && retryCount < 3) {
          console.log(`Retrying fetchUserProfile (attempt ${retryCount + 1}/3)`)
          // Remove the promise so it can be retried
          setFetchPromises(prev => {
            const newMap = new Map(prev)
            newMap.delete(userId)
            return newMap
          })
          setTimeout(() => {
            fetchUserProfile(userId, retryCount + 1)
          }, 500 * (retryCount + 1)) // Brži retry - 500ms, 1s, 1.5s
          return
        }
        
        // If there's any error after retries, create a temporary user object
        console.log('Creating temporary user object after retries failed')
        const tempUser = {
          id: userId,
          username: 'Temporary User',
          role: 'parent',
          created_at: new Date().toISOString(),
          email: 'unknown@example.com'
        }
        setUser(tempUser as User)
        setUserProfileCache(prev => new Map(prev).set(userId, tempUser as User))
      } finally {
        console.log('Setting loading to false')
        setLoading(false)
        setFetchingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(userId)
          return newSet
        })
        // Remove the promise
        setFetchPromises(prev => {
          const newMap = new Map(prev)
          newMap.delete(userId)
          return newMap
        })
      }
    } catch (error) {
      console.error('Error in fetchUserProfile wrapper:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }


  const signOut = async () => {
    try {
      setLoading(true) // Set loading to prevent multiple calls
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear cache and user data
      setUser(null)
      setSupabaseUser(null)
      setUserProfileCache(new Map())
      setFetchPromises(new Map())
      setFetchingUsers(new Set())
      
      console.log('Successfully signed out')
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    supabaseUser,
    loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
