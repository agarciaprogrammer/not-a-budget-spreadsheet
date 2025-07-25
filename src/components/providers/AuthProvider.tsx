'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (identifier: string, password: string) => Promise<void>
  signUp: (username: string, email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [supabase, setSupabase] = useState<ReturnType<typeof createBrowserSupabaseClient> | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setMounted(true)
    const client = createBrowserSupabaseClient()
    setSupabase(client)

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const signIn = async (identifier: string, password: string) => {
    if (!supabase) throw new Error('Supabase client not initialized')
    setLoading(true)
    setError(null)
    try {
      // Only allow login with username
      console.log('[Auth] Attempting login with username:', identifier)
      const { data: userByName, error: lookupError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', identifier)
        .single()
      if (lookupError || !userByName?.email) {
        setError('Username not found')
        throw new Error('Username not found')
      }
      const email = userByName.email
      console.log('[Auth] Found username, using email:', email)
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
      if (loginError) {
        console.error('[Auth] Login error:', loginError.message)
        setError(loginError.message || 'Login failed')
        throw new Error(loginError.message || 'Login failed')
      }
      // After login, check if profile exists
      const { data: session } = await supabase.auth.getSession()
      const userId = session?.session?.user?.id
      if (userId) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single()
        if (profileError) {
          console.warn('[Auth] Profile lookup error:', profileError.message)
        }
        if (!profile) {
          console.log('[Auth] No profile found, creating profile via API (POST)')
          const res = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: identifier, email }),
          })
          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            const msg = data?.error || 'Failed to create profile'
            setError(msg)
            throw new Error(msg)
          }
        }
      }
      setError(null)
      router.push('/dashboard')
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed'
      setError(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (username: string, email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client not initialized')
    setLoading(true)
    setError(null)
    try {
      // Create auth user with email
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { username },
        },
      })
      if (authError) {
        setError(authError.message || 'Sign up failed')
        throw authError
      }
      setError(null)
      // Only show verification message, profile will be created after login
      return true
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!supabase) throw new Error('Supabase client not initialized')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }

  // Don't render anything until we're mounted on the client
  if (!mounted) return null

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

