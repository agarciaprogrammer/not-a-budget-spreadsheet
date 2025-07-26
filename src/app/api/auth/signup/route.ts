import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const adminSupabase = createAdminSupabaseClient()
  const { username, email, password } = await request.json()

  try {
    // 1. Crear usuario en auth.users usando el cliente normal
    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
        data: { username },
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // 2. Si el usuario se creó exitosamente, crear perfil completo usando el cliente admin
    if (signUpData?.user?.id) {
      const { error: profileError } = await adminSupabase
        .from('profiles')
        .insert({
          id: signUpData.user.id,
          username,
          email,
          created_at: new Date().toISOString(),
        })

      if (profileError) {
        // Si falla la creación del perfil, limpiar el usuario de auth
        await adminSupabase.auth.admin.deleteUser(signUpData.user.id)
        return NextResponse.json({ 
          error: `Failed to create profile: ${profileError.message}` 
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
      error: 'Internal server error during signup' 
    }, { status: 500 })
  }
} 