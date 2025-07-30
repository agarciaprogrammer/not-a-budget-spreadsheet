import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useDashboardDate } from '@/components/providers/DashboardDateProvider'
import { transactionService } from '@/lib/services/transaction.service'

export interface CategoryBreakdownItem {
  name: string
  value: number
  percentage: number
  color: string
}

export interface CategoryBreakdownData {
  categories: CategoryBreakdownItem[]
  totalAmount: number
  topCategoriesCount: number
}

export function useCategoryBreakdown(refreshTrigger: number) {
  const { user } = useAuth()
  const { monthRange } = useDashboardDate()
  const [breakdownData, setBreakdownData] = useState<CategoryBreakdownData>({
    categories: [],
    totalAmount: 0,
    topCategoriesCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCategoryBreakdown = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const data = await transactionService.getCategoryBreakdown(user.id, {
        startDate: monthRange.startDate,
        endDate: monthRange.endDate
      })
      setBreakdownData(data)
    } catch (error) {
      console.error('Error loading category breakdown:', error)
      setError(error instanceof Error ? error.message : 'Error loading category breakdown')
    } finally {
      setLoading(false)
    }
  }, [user, monthRange])

  useEffect(() => {
    if (user) {
      loadCategoryBreakdown()
    }
  }, [user, refreshTrigger, loadCategoryBreakdown])

  return { breakdownData, loading, error }
} 