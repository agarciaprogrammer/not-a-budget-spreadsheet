import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { username, email } = await request.json()

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  console.log('[API/profile] user:', user)
  console.log('[API/profile] userError:', userError)
  console.log('[API/profile] username:', username, 'email:', email)

  if (userError || !user) {
    console.error('[API/profile] Unauthorized:', userError)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if username is taken
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single()

  if (existingUser) {
    console.error('[API/profile] Username already taken:', username)
    return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })
  }

  // Insert profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      username,
      email,
      created_at: new Date().toISOString(),
    })

  if (profileError) {
    console.error('[API/profile] Profile insert error:', profileError)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  console.log('[API/profile] Profile created successfully for user:', user.id)
  return NextResponse.json({ success: true })
}
