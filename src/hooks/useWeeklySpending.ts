import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { transactionService } from '@/lib/services/transaction.service'
import { getPastFourWeeksIntervals, formatDateToYYYYMMDD } from '@/lib/utils/date-utils'

export interface WeeklySpendingItem {
  label: string
  total: number
  weekStart: string
  weekEnd: string
  shortLabel: string // For x-axis display
}

export interface WeeklySpendingData {
  data: WeeklySpendingItem[]
  totalSpent: number
}

export function useWeeklySpending(refreshTrigger: number) {
  const { user } = useAuth()
  const [spendingData, setSpendingData] = useState<WeeklySpendingData>({
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
      const intervals = getPastFourWeeksIntervals()
      const from = formatDateToYYYYMMDD(intervals[0].start)
      const to = formatDateToYYYYMMDD(intervals[3].end)

      const spending = await transactionService.getWeeklySpending(user.id, {
        startDate: from,
        endDate: to
      })

      const weeklyData = intervals.map(({ start, end }) => {
        const week = spending.find(
          (s) => s.week_start === formatDateToYYYYMMDD(start)
        )
        
        // Format dates for display
        const startFormatted = start.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
        const endFormatted = end.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
        
        return {
          label: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
          shortLabel: `${startFormatted} - ${endFormatted}`,
          total: week?.total_spent || 0,
          weekStart: formatDateToYYYYMMDD(start),
          weekEnd: formatDateToYYYYMMDD(end)
        }
      })

      const totalSpent = weeklyData.reduce((sum, item) => sum + item.total, 0)
      setSpendingData({ data: weeklyData, totalSpent })
    } catch (error) {
      console.error('Error loading weekly spending:', error)
      setError(error instanceof Error ? error.message : 'Error loading weekly spending')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadSpendingData()
    }
  }, [user, refreshTrigger, loadSpendingData])

  return { spendingData, loading, error }
} 