import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              response.cookies.set({
                name,
                value,
                ...options,
              })
            } catch (error) {
              console.warn('Failed to set cookie in middleware:', name, error)
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              response.cookies.set({
                name,
                value: '',
                ...options,
              })
            } catch (error) {
              console.warn('Failed to remove cookie in middleware:', name, error)
            }
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()

    const { pathname } = request.nextUrl

    // Redirect root / based on auth status
    if (pathname === '/') {
      return NextResponse.redirect(new URL(session ? '/patrimonio' : '/auth', request.url))
    }

    // If user is signed in and tries to access /auth
    if (session && pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/patrimonio', request.url))
    }

    // If user is not signed in and tries to access protected routes
    const isProtectedRoute = pathname.startsWith('/dashboard') ||
      pathname.startsWith('/patrimonio') ||
      pathname.startsWith('/asignacion')

    if (!session && isProtectedRoute) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // If there's an error, allow the request to continue
    return response
  }

}

export const config = {
  matcher: [
    '/',
    '/auth',
    '/auth/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/patrimonio',
    '/patrimonio/:path*',
    '/asignacion',
    '/asignacion/:path*',
  ],
}