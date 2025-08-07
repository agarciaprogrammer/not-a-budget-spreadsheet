import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { authService } from '@/lib/services/auth.service'

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export interface AuthActions {
  signIn: (identifier: string, password: string) => Promise<void>
  signUp: (username: string, email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
}

export function useAuthentication(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })
  const router = useRouter()

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        // Solo ejecutar en el cliente
        if (typeof window === 'undefined') return
        
        const { data: { session } } = await authService.getCurrentSession()
        if (mounted) {
          setState(prev => ({
            ...prev,
            user: session?.user ?? null,
            loading: false,
          }))
        }
      } catch {
        if (mounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to initialize authentication',
          }))
        }
      }
    }

    const setupAuthListener = () => {
      try {
        const { data: { subscription } } = authService.onAuthStateChange(
          async (event, session) => {
            if (mounted) {
              setState(prev => ({
                ...prev,
                user: session?.user ?? null,
                loading: false,
                error: null,
              }))
            }
            router.refresh()
          }
        )
        return subscription
      } catch {
        console.error('Failed to setup auth listener')
        return null
      }
    }

    let subscription: ReturnType<typeof authService.onAuthStateChange>['data']['subscription'] | null = null
    
    const init = async () => {
      await initializeAuth()
      subscription = setupAuthListener()
    }

    init()

    return () => {
      mounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [router])

  const signIn = useCallback(async (identifier: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const result = await authService.authenticateUser(identifier, password)
      if (!result.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error.message
        }))
        throw new Error(result.error.message)
      }
      const hasProfileResult = await authService.hasUserProfile(result.data.id)
      if (hasProfileResult.success && !hasProfileResult.data) {
        const profileResult = await authService.createUserProfile({
          username: identifier,
          email: result.data.email || '',
        })
        if (!profileResult.success) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: profileResult.error.message
          }))
          throw new Error(profileResult.error.message)
        }
      }
      const budgetResult = await authService.setupUserBudget()
      if (!budgetResult.success) {
        console.warn('Budget setup failed:', budgetResult.error.message)
      }
      setState(prev => ({ ...prev, loading: false, error: null }))
      router.push('/dashboard')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      throw error
    }
  }, [router])

  const signUp = useCallback(async (username: string, email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const result = await authService.registerUser(username, email, password)
      if (!result.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error.message
        }))
        throw new Error(result.error.message)
      }
      setState(prev => ({ ...prev, loading: false, error: null }))
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const result = await authService.signOut()
      if (!result.success) {
        console.error('Logout error:', result.error.message)
        // Aún así, limpiar el estado local y redirigir
        setState(prev => ({ ...prev, user: null, loading: false }))
      }
      // Siempre redirigir a /auth, sin importar si el logout fue exitoso
      router.push('/auth')
    } catch (error) {
      console.error('Logout error:', error)
      // Limpiar el estado local y redirigir
      setState(prev => ({ ...prev, user: null, loading: false }))
      router.push('/auth')
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [router])

  return {
    ...state,
    signIn,
    signUp,
    signOut,
  }
} 