import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Session } from '@supabase/supabase-js'

// Rutas que requieren autenticación
const PROTECTED_ROUTES = ['/dashboard']
// Rutas que solo son accesibles para usuarios no autenticados
const PUBLIC_ONLY_ROUTES = ['/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Solo procesar rutas relevantes
  if (!isRelevantRoute(pathname)) {
    return NextResponse.next()
  }

  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Redirigir desde la raíz basado en el estado de autenticación
  if (pathname === '/') {
    return redirectBasedOnAuthState(session, request.url)
  }

  // Proteger rutas que requieren autenticación
  if (isProtectedRoute(pathname) && !session) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Redirigir usuarios autenticados fuera de rutas públicas
  if (isPublicOnlyRoute(pathname) && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

/**
 * Determina si una ruta es relevante para el middleware
 */
function isRelevantRoute(pathname: string): boolean {
  return pathname === '/' || 
         PROTECTED_ROUTES.some(route => pathname.startsWith(route)) ||
         PUBLIC_ONLY_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Determina si una ruta requiere autenticación
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Determina si una ruta es solo para usuarios no autenticados
 */
function isPublicOnlyRoute(pathname: string): boolean {
  return PUBLIC_ONLY_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Redirige basado en el estado de autenticación
 */
function redirectBasedOnAuthState(session: Session | null, baseUrl: string): NextResponse {
  if (session) {
    return NextResponse.redirect(new URL('/dashboard', baseUrl))
  } else {
    return NextResponse.redirect(new URL('/auth', baseUrl))
  }
}

export const config = {
  matcher: ['/', '/auth', '/dashboard'],
}
