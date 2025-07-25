import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  // Only run for the root route
  if (request.nextUrl.pathname === '/') {
    const supabase = await createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.redirect(new URL('/auth', request.url))
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/auth', '/dashboard'],
}
