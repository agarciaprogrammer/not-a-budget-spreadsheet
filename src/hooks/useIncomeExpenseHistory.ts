import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { transactionService } from '@/lib/services/transaction.service'

export interface IncomeExpenseHistoryItem {
  month: string
  income: number
  expense: number
}

export interface IncomeExpenseHistoryData {
  data: IncomeExpenseHistoryItem[]
  monthsBack: number
}

export function useIncomeExpenseHistory(refreshTrigger: number, monthsBack: number = 6) {
  const { user } = useAuth()
  const [historyData, setHistoryData] = useState<IncomeExpenseHistoryData>({
    data: [],
    monthsBack
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadHistoryData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const data = await transactionService.getIncomeExpenseHistory(user.id, monthsBack)
      setHistoryData({ data, monthsBack })
    } catch (error) {
      console.error('Error loading income/expense history:', error)
      setError(error instanceof Error ? error.message : 'Error loading income/expense history')
    } finally {
      setLoading(false)
    }
  }, [user, monthsBack])

  useEffect(() => {
    if (user) {
      loadHistoryData()
    }
  }, [user, refreshTrigger, loadHistoryData])

  return { historyData, loading, error }
} 