import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './types'

export const createServerSupabaseClient = async () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name: string) => {
          try {
            return cookieStore.get(name)?.value ?? ''
          } catch (error) {
            console.warn('Failed to get cookie:', name, error)
            return ''
          }
        },
        set: (name: string, value: string, options: CookieOptions) => {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.warn('Failed to set cookie:', name, error)
          }
        },
        remove: (name: string) => {
          try {
            cookieStore.delete(name)
          } catch (error) {
            console.warn('Failed to remove cookie:', name, error)
          }
        }
      }
    }
  )
}