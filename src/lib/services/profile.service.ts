import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { Result, tryAsync } from '@/lib/types/result'
import type { User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  username: string
  email: string
  created_at: string
}

export interface CreateProfileData {
  username: string
  email: string
}

export class ProfileService {
  /**
   * Crea un perfil de usuario usando el cliente admin
   */
  async createProfile(userId: string, profileData: CreateProfileData): Promise<Result<Profile>> {
    return tryAsync(async () => {
      const adminSupabase = createAdminSupabaseClient()

      const { data, error } = await adminSupabase
        .from('profiles')
        .insert({
          id: userId,
          username: profileData.username,
          email: profileData.email,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create profile: ${error.message}`)
      }

      return data as Profile
    })
  }

  /**
   * Obtiene un perfil por ID de usuario
   */
  async getProfileByUserId(userId: string): Promise<Result<Profile | null>> {
    return tryAsync(async () => {
      const supabase = await createServerSupabaseClient()

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Failed to get profile: ${error.message}`)
      }

      return data as Profile | null
    })
  }

  /**
   * Verifica si un username ya está en uso
   */
  async isUsernameTaken(username: string): Promise<Result<boolean>> {
    return tryAsync(async () => {
      const supabase = await createServerSupabaseClient()

      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to check username: ${error.message}`)
      }

      return !!data
    })
  }

  /**
   * Obtiene el usuario autenticado actual
   */
  async getCurrentUser(): Promise<Result<User>> {
    return tryAsync(async () => {
      const supabase = await createServerSupabaseClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        throw new Error(`Failed to get current user: ${error.message}`)
      }

      if (!user) {
        throw new Error('No authenticated user found')
      }

      return user
    })
  }
}

// Instancia singleton del servicio
export const profileService = new ProfileService() 