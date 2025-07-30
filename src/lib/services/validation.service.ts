import { z } from 'zod'

export interface ValidationError {
  field: string
  message: string
}

export class ValidationService {
  /**
   * Valida datos usando un esquema Zod
   */
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: ValidationError[] } {
    try {
      const validatedData = schema.parse(data)
      return { success: true, data: validatedData }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
        return { success: false, errors }
      }
      return { 
        success: false, 
        errors: [{ field: 'unknown', message: 'Validation failed' }] 
      }
    }
  }

  /**
   * Valida que un string no esté vacío
   */
  static isNotEmpty(value: string, fieldName: string): ValidationError | null {
    if (!value || value.trim().length === 0) {
      return {
        field: fieldName,
        message: `${fieldName} is required`
      }
    }
    return null
  }

  /**
   * Valida que un email tenga formato válido
   */
  static isValidEmail(email: string): ValidationError | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        field: 'email',
        message: 'Invalid email format'
      }
    }
    return null
  }

  /**
   * Valida que una contraseña tenga la longitud mínima
   */
  static isValidPassword(password: string, minLength: number = 6): ValidationError | null {
    if (password.length < minLength) {
      return {
        field: 'password',
        message: `Password must be at least ${minLength} characters long`
      }
    }
    return null
  }

  /**
   * Valida que un username tenga el formato correcto
   */
  static isValidUsername(username: string): ValidationError | null {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username)) {
      return {
        field: 'username',
        message: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores'
      }
    }
    return null
  }

  /**
   * Valida múltiples campos y retorna todos los errores
   */
  static validateMultiple(validations: (ValidationError | null)[]): ValidationError[] {
    return validations.filter((error): error is ValidationError => error !== null)
  }
} 