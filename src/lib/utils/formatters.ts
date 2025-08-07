/**
 * Formatea un número como moneda
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formatea una fecha
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  },
  locale: string = 'es-ES'
): string {
  let dateObj: Date
  
  if (typeof date === 'string') {
    // Handle YYYY-MM-DD format properly (treat as local date)
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number)
      dateObj = new Date(year, month - 1, day) // month is 0-indexed
    } else {
      dateObj = new Date(date)
    }
  } else {
    dateObj = date
  }
  
  return dateObj.toLocaleDateString(locale, options)
}

/**
 * Formatea un número como porcentaje
 */
export function formatPercentage(
  value: number,
  decimals: number = 2,
  locale: string = 'es-ES'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(number: number): string {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number)
}

/**
 * Formatea un tamaño de archivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Formatea un tiempo relativo (ej: "hace 2 horas")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'hace un momento'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`
  }

  return formatDate(targetDate)
}

/**
 * Trunca un texto a una longitud específica
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - suffix.length) + suffix
}

/**
 * Capitaliza la primera letra de cada palabra
 */
export function capitalizeWords(text: string): string {
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

/**
 * Convierte un string a slug (URL-friendly)
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
} 

export function getMonthName(month: number, locale: string = 'en'): string {
  const date = new Date(2024, month - 1, 1) // month is 1-12, Date constructor expects 0-11
  const localeCode = locale === 'es' ? 'es-ES' : 'en-US'
  const monthName = date.toLocaleDateString(localeCode, { month: 'long' })
  
  // Capitalize first letter for Spanish
  if (locale === 'es') {
    return monthName.charAt(0).toUpperCase() + monthName.slice(1)
  }
  
  return monthName
} 