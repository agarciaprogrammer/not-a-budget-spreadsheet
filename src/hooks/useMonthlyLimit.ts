import { useState, useEffect } from 'react'
import { budgetService } from '@/lib/services/budget.service'
import { transactionService } from '@/lib/services/transaction.service'
import { formatDateToYYYYMMDD } from '@/lib/utils/date-utils'

export function useMonthlyLimit(userId: string | undefined, refreshTrigger?: number) {
  const [limit, setLimit] = useState<number | null>(null)
  const [spent, setSpent] = useState(0)
  const [debitSpent, setDebitSpent] = useState(0)
  const [creditSpent, setCreditSpent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number }>({ year: 0, month: 0 })

  useEffect(() => {
    async function load() {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Get current month
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() + 1 // getMonth() returns 0-11
        setCurrentMonth({ year: currentYear, month: currentMonth })

        // Get the monthly limit for current month
        const fetchedLimit = await budgetService.getMonthlyLimit(userId, currentYear, currentMonth)
        setLimit(fetchedLimit)

        if (fetchedLimit != null) {
          // Calculate current month's spending window (full month)
          const start = new Date(currentYear, currentMonth - 1, 1)
          const lastDay = new Date(currentYear, currentMonth, 0).getDate()
          const end = new Date(currentYear, currentMonth - 1, lastDay)

          const summary = await transactionService.getTransactionSummary(userId, {
            dateRange: {
              startDate: formatDateToYYYYMMDD(start),
              endDate: formatDateToYYYYMMDD(end),
            }
          })

          setDebitSpent(summary.debitExpenses ?? 0)
          setCreditSpent(summary.creditExpenses ?? 0)
          setSpent(summary.totalExpenses ?? 0)
        }
      } catch (err) {
        console.error('Error loading monthly limit data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load monthly limit data')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId, refreshTrigger])

  const updateLimit = async (newLimit: number) => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      await budgetService.setMonthlyLimit(userId, newLimit, currentMonth.year, currentMonth.month)
      setLimit(newLimit)

      const start = new Date(currentMonth.year, currentMonth.month - 1, 1)
      const lastDay = new Date(currentMonth.year, currentMonth.month, 0).getDate()
      const end = new Date(currentMonth.year, currentMonth.month - 1, lastDay)

      const summary = await transactionService.getTransactionSummary(userId, {
        dateRange: {
          startDate: formatDateToYYYYMMDD(start),
          endDate: formatDateToYYYYMMDD(end),
        }
      })

      setDebitSpent(summary.debitExpenses ?? 0)
      setCreditSpent(summary.creditExpenses ?? 0)
      setSpent(summary.totalExpenses ?? 0)
    } catch (err) {
      console.error('Error updating monthly limit:', err)
      setError(err instanceof Error ? err.message : 'Failed to update monthly limit')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const remaining = limit ? limit - spent : 0
  const percentUsed = limit ? Math.min((spent / limit) * 100, 100) : 0
  const isOverLimit = limit ? spent > limit : false

  return {
    limit,
    spent,
    debitSpent,
    creditSpent,
    remaining,
    percentUsed,
    isOverLimit,
    loading,
    error,
    updateLimit,
    currentMonth,
  }
}
