import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useDashboardDate } from '@/components/providers/DashboardDateProvider'
import { transactionService } from '@/lib/services/transaction.service'

export interface SpendingByDayItem {
  dayOfWeek: string
  totalSpent: number
  dayIndex: number
  date: string
}

export interface SpendingByDayData {
  data: SpendingByDayItem[]
  totalSpent: number
}

export function useSpendingByDay(refreshTrigger: number) {
  const { user } = useAuth()
  const { monthRange } = useDashboardDate()
  const [spendingData, setSpendingData] = useState<SpendingByDayData>({
    data: [],
    totalSpent: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSpendingData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const data = await transactionService.getSpendingByDayOfWeek(user.id, {
        startDate: monthRange.startDate,
        endDate: monthRange.endDate
      })
      
      const totalSpent = data.reduce((sum, item) => sum + item.totalSpent, 0)
      setSpendingData({ data, totalSpent })
    } catch (error) {
      console.error('Error loading spending by day:', error)
      setError(error instanceof Error ? error.message : 'Error loading spending by day')
    } finally {
      setLoading(false)
    }
  }, [user, monthRange])

  useEffect(() => {
    if (user) {
      loadSpendingData()
    }
  }, [user, refreshTrigger, loadSpendingData])

  return { spendingData, loading, error }
} 