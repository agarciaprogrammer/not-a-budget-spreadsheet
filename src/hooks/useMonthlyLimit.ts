import { useState, useEffect } from 'react'
import { budgetService } from '@/lib/services/budget.service'
import { transactionService } from '@/lib/services/transaction.service'
import { formatDateToYYYYMMDD } from '@/lib/utils/date-utils'

export function useMonthlyLimit(userId: string | undefined, refreshTrigger?: number) {
  const [limit, setLimit] = useState<number | null>(null)
  const [spent, setSpent] = useState(0)
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
          // Calculate current month's spending
          const start = new Date(currentYear, currentMonth - 1, 1) // month - 1 because getMonth() returns 0-11
          const end = new Date()
          
          console.log('Monthly limit calculation:', {
            startDate: formatDateToYYYYMMDD(start),
            endDate: formatDateToYYYYMMDD(end),
            limit: fetchedLimit,
            year: currentYear,
            month: currentMonth
          })
          
          const summary = await transactionService.getTransactionSummary(userId, {
            startDate: formatDateToYYYYMMDD(start),
            endDate: formatDateToYYYYMMDD(end),
          })
          
          console.log('Summary data:', summary)
          setSpent(summary.totalExpenses)
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
      
      // Refresh the spent amount after updating the limit
      const start = new Date(currentMonth.year, currentMonth.month - 1, 1)
      const end = new Date()
      
      const summary = await transactionService.getTransactionSummary(userId, {
        startDate: formatDateToYYYYMMDD(start),
        endDate: formatDateToYYYYMMDD(end),
      })
      
      setSpent(summary.totalExpenses)
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
    remaining,
    percentUsed,
    isOverLimit,
    loading,
    error,
    updateLimit,
    currentMonth,
  }
} 