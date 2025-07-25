import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    redirect('/auth')
  } else {
    redirect('/dashboard')
  }
  // This will never render
  return null
}
