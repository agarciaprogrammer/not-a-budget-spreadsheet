import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export const useAuth = () => {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const signIn = async (identifier: string, password: string) => {
    // Try username first
    const { data: userByName } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', identifier)
      .single()

    const email = userByName?.email || identifier // Fallback to using identifier as email

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    router.refresh()
    router.push('/dashboard')
  }

  const signUp = async (username: string, email: string, password: string) => {
    // Check if username is taken
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single()

    if (existingUser) {
      throw new Error('Username is already taken')
    }

    // Create auth user with email
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          username, // Store username in user metadata
        },
      },
    })

    if (authError) {
      throw authError
    }

    // Create profile entry with username
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username,
          email,
          created_at: new Date().toISOString(),
        })

      if (profileError) {
        // Cleanup auth user if profile creation fails
        await supabase.auth.signOut()
        throw profileError
      }
    }

    return true
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw error
    }

    router.refresh()
    router.push('/auth')
  }

  return {
    signIn,
    signUp,
    signOut,
  }
}
