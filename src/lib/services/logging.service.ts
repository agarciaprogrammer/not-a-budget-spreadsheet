export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
  error?: Error
}

export class LoggingService {
  private static instance: LoggingService
  private isDevelopment = process.env.NODE_ENV === 'development'

  private constructor() {}

  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService()
    }
    return LoggingService.instance
  }

  /**
   * Registra un mensaje de debug
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  /**
   * Registra un mensaje informativo
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context)
  }

  /**
   * Registra una advertencia
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context)
  }

  /**
   * Registra un error
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context, error)
  }

  /**
   * Registra una operación de autenticación
   */
  auth(operation: string, userId?: string, context?: Record<string, unknown>): void {
    this.info(`Auth: ${operation}`, { userId, ...context })
  }

  /**
   * Registra una operación de base de datos
   */
  database(operation: string, table: string, context?: Record<string, unknown>): void {
    this.debug(`DB: ${operation} on ${table}`, context)
  }

  /**
   * Registra una operación de API
   */
  api(method: string, path: string, statusCode: number, context?: Record<string, unknown>): void {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO
    this.log(level, `API: ${method} ${path} - ${statusCode}`, context)
  }

  /**
   * Método interno para registrar logs
   */
  private log(
    level: LogLevel, 
    message: string, 
    context?: Record<string, unknown>, 
    error?: Error
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error
    }

    // En desarrollo, mostrar logs en consola
    if (this.isDevelopment) {
      const logMethod = level === LogLevel.ERROR ? console.error :
                       level === LogLevel.WARN ? console.warn :
                       level === LogLevel.INFO ? console.info : console.debug

      logMethod(`[${level.toUpperCase()}] ${message}`, {
        timestamp: entry.timestamp,
        context: entry.context,
        error: entry.error?.stack
      })
    }

    // En producción, podrías enviar logs a un servicio externo
    // this.sendToExternalService(entry)
  }

  /**
   * Envía logs a un servicio externo (implementación futura)
   */
  private sendToExternalService(): void {
    // Implementar envío a servicios como Sentry, LogRocket, etc.
    // Por ahora, solo en desarrollo
  }
}

// Instancia singleton del servicio
export const logger = LoggingService.getInstance() 