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
      let email = null
      let userByName = null
      let lookupError = null
      // Buscar por username en profiles
      const lookup = await supabase
        .from('profiles')
        .select('email')
        .eq('username', identifier)
        .single()
      userByName = lookup.data
      lookupError = lookup.error
      if (lookupError || !userByName?.email) {
        // Si no existe en profiles, intentamos login usando el identificador como email
        email = identifier
      } else {
        email = userByName.email
      }
      console.log('[Auth] Found email for login:', email)
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
            credentials: 'include',
          })
          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            const msg = data?.error || 'Failed to create profile'
            setError(msg)
            throw new Error(msg)
          }
        }

        // Setup budget if user doesn't have one
        const budgetRes = await fetch('/api/budget/setup', {
          method: 'POST',
          credentials: 'include',
        })
        
        if (!budgetRes.ok) {
          console.warn('[Auth] Budget setup failed:', await budgetRes.text())
        } else {
          console.log('[Auth] Budget setup completed')
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
      // Usar el endpoint del servidor para signup
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Sign up failed')
        throw new Error(data.error || 'Sign up failed')
      }

      setError(null)
      return true // Indica que se debe mostrar mensaje de verificación
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Sign up failed'
      setError(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!supabase) throw new Error('Supabase client not initialized')
    setLoading(true)
    try {
      // Usar el endpoint del servidor para logout
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Logout failed')
      }

      router.push('/auth')
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: intentar logout directo si falla el endpoint
      const { error: supabaseError } = await supabase.auth.signOut()
      if (supabaseError) {
        console.error('Fallback logout error:', supabaseError)
      }
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

