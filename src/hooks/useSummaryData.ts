import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useDashboardDate } from '@/components/providers/DashboardDateProvider'
import { transactionService } from '@/lib/services/transaction.service'

export function useSummaryData(refreshTrigger: number) {
  const { user } = useAuth()
  const { monthRange } = useDashboardDate()
  const [summaryData, setSummaryData] = useState({
    totalIncome: 0,
    totalFixedExpenses: 0,
    totalVariableExpenses: 0,
    totalExpenses: 0,
    netBalance: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSummaryData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const data = await transactionService.getTransactionSummary(user.id, {
        dateRange: {
          startDate: monthRange.startDate,
          endDate: monthRange.endDate
        }
      })
      setSummaryData(data)
    } catch (error) {
      console.error('Error loading summary data:', error)
      setError(error instanceof Error ? error.message : 'Error loading summary data')
    } finally {
      setLoading(false)
    }
  }, [user, monthRange])

  useEffect(() => {
    if (user) {
      loadSummaryData()
    }
  }, [user, refreshTrigger, loadSummaryData])

  return { summaryData, loading, error }
} 
