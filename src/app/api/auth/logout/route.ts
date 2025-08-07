import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { tryAsync } from '@/lib/types/result'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Verificar si hay una sesión antes de intentar logout
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      // Si no hay sesión, considerar el logout como exitoso
      console.log('No active session found during logout')
      return NextResponse.json({ success: true, message: 'No active session' })
    }
    
    const logoutResult = await tryAsync(async () => {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw new Error(error.message)
      }
    })

    if (!logoutResult.success) {
      return NextResponse.json({ error: logoutResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error during logout' 
    }, { status: 500 })
  }
} 