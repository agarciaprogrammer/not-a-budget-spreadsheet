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

    const { data: { session }} = await supabase.auth.getSession()

    // If user is signed in and tries to access /auth
    if (session && request.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // If user is not signed in and tries to access protected routes
    if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
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
  matcher: ['/dashboard/:path*', '/auth/:path*'],
}
