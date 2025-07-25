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

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: async (name: string) => {
          const cookieStore = await cookies()
          return cookieStore.get(name)?.value ?? ''
        },
        set: async (name: string, value: string, options: CookieOptions) => {
          const cookieStore = await cookies()
          cookieStore.set({ name, value, ...options })
        },
        remove: async (name: string, options: CookieOptions) => {
          const cookieStore = await cookies()
          cookieStore.delete(name)
        }
      }
    }
  )
}