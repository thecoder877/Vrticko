import React, { createContext, useContext, useState } from 'react'
import type { User } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  supabaseUser: any
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string, role: string) => Promise<void>
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
  const [loading, setLoading] = useState(false)

  const signIn = async (_email: string, _password: string) => {
    setLoading(true)
    // Demo login - accept any credentials
    setTimeout(() => {
      setUser({
        id: 'demo-user-id',
        username: 'Demo Korisnik',
        role: 'parent',
        created_at: new Date().toISOString()
      })
      setLoading(false)
    }, 1000)
  }

  const signUp = async (_email: string, _password: string, username: string, role: string) => {
    setLoading(true)
    // Demo signup
    setTimeout(() => {
      setUser({
        id: 'demo-user-id',
        username: username,
        role: role as 'parent' | 'teacher' | 'admin',
        created_at: new Date().toISOString()
      })
      setLoading(false)
    }, 1000)
  }

  const signOut = async () => {
    setUser(null)
  }

  const value = {
    user,
    supabaseUser: null,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
