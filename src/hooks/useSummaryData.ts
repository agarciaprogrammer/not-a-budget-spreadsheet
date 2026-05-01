import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useDashboardDate } from '@/components/providers/DashboardDateProvider'
import { transactionService } from '@/lib/services/transaction.service'

export function useSummaryData(refreshTrigger: number) {
  const { user } = useAuth()
  const { monthRange } = useDashboardDate()
  const [summaryData, setSummaryData] = useState({
    openingBalance: {
      ARS: 0,
      USD: 0,
    },
    totalIncome: 0,
    totalFixedExpenses: 0,
    totalVariableExpenses: 0,
    totalExpenses: 0,
    netBalance: {
      ARS: 0,
      USD: 0,
    },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSummaryData = useCallback(async () => {
    if (!user) return
    const currentRequestId = requestIdRef.current

    // mark loading only for the active request
    setLoading(true)
    setError(null)

    try {
      const data = await transactionService.getTransactionSummary(user.id, {
        dateRange: {
          startDate: monthRange.startDate,
          endDate: monthRange.endDate
        }
      })

      // only update state if this is the latest request
      if (requestIdRef.current === currentRequestId) {
        setSummaryData(data)
      }
    } catch (error) {
      console.error('Error loading summary data:', error)
      if (requestIdRef.current === currentRequestId) {
        setError(error instanceof Error ? error.message : 'Error loading summary data')
      }
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setLoading(false)
      }
    }
  }, [user, monthRange])

  // requestId guard to avoid stale async responses overwriting state
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!user) return

    // increment requestId once to invalidate any previous requests
    requestIdRef.current += 1
    const thisRequestId = requestIdRef.current

    loadSummaryData()

    // cleanup: invalidate this request when effect deps change or unmount
    return () => {
      if (requestIdRef.current === thisRequestId) {
        requestIdRef.current += 1
      }
    }
  }, [user, refreshTrigger, loadSummaryData])

  return { summaryData, loading, error }
} 
