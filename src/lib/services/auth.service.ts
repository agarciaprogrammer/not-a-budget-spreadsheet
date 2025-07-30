import type { User, Session } from '@supabase/supabase-js'
import { Result, success, failure, tryAsync } from '@/lib/types/result'
import { logger } from './logging.service'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface ProfileData {
  username: string
  email: string
}

export class AuthenticationService {
  private getSupabaseClient() {
    if (typeof window === 'undefined') {
      throw new Error('AuthenticationService must be used in browser environment')
    }
    
    return createBrowserSupabaseClient()
  }

  /**
   * Autentica un usuario usando username o email
   * Maneja la lógica de búsqueda y fallback internamente
   */
  async authenticateUser(identifier: string, password: string): Promise<Result<User>> {
    return tryAsync(async () => {
      logger.auth('login_attempt', undefined, { identifier })
      const supabase = this.getSupabaseClient()
      
      // Buscar usuario por username primero
      const email = await this.findUserEmail(identifier, supabase)
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })

      if (error) {
        logger.auth('login_failed', undefined, { identifier, error: error.message })
        throw new Error(error.message)
      }

      if (!data.user) {
        logger.auth('login_failed', undefined, { identifier, error: 'No user returned' })
        throw new Error('Authentication failed')
      }

      logger.auth('login_success', data.user.id, { identifier })
      return data.user
    })
  }

  /**
   * Busca el email de un usuario por username
   * Si no encuentra, asume que el identifier es un email
   */
  private async findUserEmail(identifier: string, supabase: SupabaseClient): Promise<string> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', identifier)
      .single()

    if (error || !profile?.email) {
      // Si no existe en profiles, asumir que es un email
      logger.debug('Username not found, using as email', { identifier })
      return identifier
    }

    logger.debug('Found email for username', { identifier, email: profile.email })
    return profile.email
  }

  /**
   * Verifica si un usuario tiene un perfil creado
   */
  async hasUserProfile(userId: string): Promise<Result<boolean>> {
    return tryAsync(async () => {
      const supabase = this.getSupabaseClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      const hasProfile = !error && !!data
      logger.debug('Profile check result', { userId, hasProfile })
      return hasProfile
    })
  }

  /**
   * Crea un perfil de usuario
   */
  async createUserProfile(profileData: ProfileData): Promise<Result<void>> {
    return tryAsync(async () => {
      logger.auth('profile_creation_attempt', undefined, { username: profileData.username })
      
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json()
        logger.auth('profile_creation_failed', undefined, { 
          username: profileData.username, 
          error: data?.error 
        })
        throw new Error(data?.error || 'Failed to create profile')
      }

      logger.auth('profile_creation_success', undefined, { username: profileData.username })
    })
  }

  /**
   * Configura el presupuesto por defecto para un usuario
   */
  async setupUserBudget(): Promise<Result<void>> {
    return tryAsync(async () => {
      logger.debug('Budget setup attempt')
      
      const response = await fetch('/api/budget/setup', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json()
        logger.warn('Budget setup failed', { error: data?.error })
        throw new Error(data?.error || 'Budget setup failed')
      }

      logger.debug('Budget setup completed successfully')
    })
  }

  /**
   * Registra un nuevo usuario
   */
  async registerUser(username: string, email: string, password: string): Promise<Result<void>> {
    return tryAsync(async () => {
      logger.auth('registration_attempt', undefined, { username, email })
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        logger.auth('registration_failed', undefined, { username, email, error: data.error })
        throw new Error(data.error || 'Registration failed')
      }

      logger.auth('registration_success', undefined, { username, email })
    })
  }

  /**
   * Cierra la sesión del usuario
   */
  async signOut(): Promise<Result<void>> {
    return tryAsync(async () => {
      logger.auth('logout_attempt')
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        logger.auth('logout_failed', undefined, { error: data.error })
        throw new Error(data.error || 'Logout failed')
      }

      logger.auth('logout_success')
    }).then(result => {
      if (!result.success) {
        // Fallback: intentar logout directo
        logger.warn('Using fallback logout method')
        const supabase = this.getSupabaseClient()
        return supabase.auth.signOut().then(({ error }: { error: { message: string } | null }) => {
          if (error) {
            logger.auth('fallback_logout_failed', undefined, { error: error.message })
            return failure(new Error(error.message))
          }
          logger.auth('fallback_logout_success')
          return success(undefined)
        })
      }
      return result
    })
  }

  /**
   * Obtiene la sesión actual
   */
  async getCurrentSession() {
    const supabase = this.getSupabaseClient()
    return await supabase.auth.getSession()
  }

  /**
   * Suscribe a cambios de estado de autenticación
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const supabase = this.getSupabaseClient()
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Instancia singleton del servicio
export const authService = new AuthenticationService() 