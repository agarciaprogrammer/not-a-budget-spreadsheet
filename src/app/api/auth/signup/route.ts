import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { profileService } from '@/lib/services/profile.service'
import { tryAsync } from '@/lib/types/result'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()
    const supabase = await createServerSupabaseClient()
    const adminSupabase = createAdminSupabaseClient()

    // Verificar si el username ya está en uso
    const usernameCheckResult = await profileService.isUsernameTaken(username)
    if (usernameCheckResult.success && usernameCheckResult.data) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })
    }

    // Crear usuario en auth.users
    const signUpResult = await tryAsync(async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
          data: { username },
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      return data
    })

    if (!signUpResult.success) {
      return NextResponse.json({ error: signUpResult.error.message }, { status: 400 })
    }

    // Si el usuario se creó exitosamente, crear perfil completo
    if (signUpResult.data?.user?.id) {
      const profileResult = await profileService.createProfile(
        signUpResult.data.user.id,
        { username, email }
      )

      if (!profileResult.success) {
        // Si falla la creación del perfil, limpiar el usuario de auth
        await adminSupabase.auth.admin.deleteUser(signUpResult.data.user.id)
        return NextResponse.json({ 
          error: profileResult.error.message 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User created successfully. Please check your email to confirm your account.' 
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error during signup' 
    }, { status: 500 })
  }
} 