/**
 * Date utility functions for dashboard filtering
 */

export interface MonthDateRange {
  startDate: string // YYYY-MM-DD format
  endDate: string // YYYY-MM-DD format
  startOfMonth: Date
  endOfMonth: Date
}

/**
 * Get the date range for a specific month
 * @param date - Date object representing the month (day doesn't matter)
 * @returns MonthDateRange with start and end dates
 */
export function getMonthDateRange(date: Date): MonthDateRange {
  const year = date.getFullYear()
  const month = date.getMonth()
  
  const startOfMonth = new Date(year, month, 1)
  const endOfMonth = new Date(year, month + 1, 0) // Last day of month
  
  return {
    startDate: formatDateToYYYYMMDD(startOfMonth),
    endDate: formatDateToYYYYMMDD(endOfMonth),
    startOfMonth,
    endOfMonth
  }
}

/**
 * Get the current month date range
 * @returns MonthDateRange for current month
 */
export function getCurrentMonthRange(): MonthDateRange {
  return getMonthDateRange(new Date())
}

/**
 * Format a date for display in month selector
 * @param date - Date to format
 * @returns Formatted string like "January 2024"
 */
export function formatMonthForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  })
}

/**
 * Get a date object for a specific month (1-indexed)
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Date object for the first day of that month
 */
export function getDateForMonth(year: number, month: number): Date {
  return new Date(year, month - 1, 1)
}

/**
 * Format a date as YYYY-MM-DD string
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Check if a date is within a month range
 * @param date - Date to check (can be Date object or YYYY-MM-DD string)
 * @param monthRange - Month date range
 * @returns True if date is within the range
 */
export function isDateInMonthRange(date: Date | string, monthRange: MonthDateRange): boolean {
  // If date is a string in YYYY-MM-DD format, parse it as local date
  let dateToCheck: Date
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number)
    dateToCheck = new Date(year, month - 1, day) // month is 0-indexed
  } else {
    dateToCheck = new Date(date)
  }
  return dateToCheck >= monthRange.startOfMonth && dateToCheck <= monthRange.endOfMonth
}

/**
 * Returns array of week intervals for current and previous 3 weeks
 * @param referenceDate - Reference date (defaults to current date)
 * @returns Array of week intervals with start and end dates
 */
export function getPastFourWeeksIntervals(referenceDate: Date = new Date()) {
  const weeks = []
  const current = new Date(referenceDate)

  for (let i = 0; i < 4; i++) {
    const start = new Date(current)
    start.setDate(current.getDate() - current.getDay()) // Start of the week (Sunday)

    const end = new Date(start)
    end.setDate(start.getDate() + 6) // End of the week (Saturday)

    weeks.push({ start, end })

    current.setDate(current.getDate() - 7) // Move to previous week
  }

  return weeks.reverse() // From oldest to newest
} 