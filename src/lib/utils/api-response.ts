import { NextResponse } from 'next/server'
import { Result } from '@/lib/types/result'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Crea una respuesta exitosa de API
 */
export function successResponse<T>(data: T, message?: string): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  }
  return NextResponse.json(response)
}

/**
 * Crea una respuesta de error de API
 */
export function errorResponse(error: string, status: number = 500): NextResponse {
  const response: ApiResponse = {
    success: false,
    error,
  }
  return NextResponse.json(response, { status })
}

/**
 * Maneja un Result y retorna la respuesta apropiada
 */
export function handleResult<T>(
  result: Result<T>,
  successMessage?: string
): NextResponse {
  if (result.success) {
    return successResponse(result.data, successMessage)
  } else {
    return errorResponse(result.error.message)
  }
}

/**
 * Maneja errores de manera consistente
 */
export function handleError(error: unknown, defaultMessage: string = 'Internal server error'): NextResponse {
  const message = error instanceof Error ? error.message : defaultMessage
  console.error('API Error:', error)
  return errorResponse(message)
}

/**
 * Valida que el usuario esté autenticado
 */
export function requireAuth(userResult: Result<unknown>): NextResponse | null {
  if (!userResult.success) {
    return errorResponse('Unauthorized', 401)
  }
  return null
} 