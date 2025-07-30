/**
 * Tipo Result para unificar el manejo de errores
 * Basado en el patrón Result/Either de programación funcional
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * Crea un Result exitoso
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data }
}

/**
 * Crea un Result fallido
 */
export function failure<E>(error: E): Result<never, E> {
  return { success: false, error }
}

/**
 * Ejecuta una función async y retorna un Result
 */
export async function tryAsync<T>(
  fn: () => Promise<T>
): Promise<Result<T, Error>> {
  try {
    const data = await fn()
    return success(data)
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Mapea un Result exitoso a otro tipo
 */
export function mapResult<T, U>(
  result: Result<T>,
  fn: (data: T) => U
): Result<U> {
  if (result.success) {
    return success(fn(result.data))
  }
  return result
}

/**
 * Ejecuta una función solo si el Result es exitoso
 */
export function flatMapResult<T, U>(
  result: Result<T>,
  fn: (data: T) => Result<U>
): Result<U> {
  if (result.success) {
    return fn(result.data)
  }
  return result
} 