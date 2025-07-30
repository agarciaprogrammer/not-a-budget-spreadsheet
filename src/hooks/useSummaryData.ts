import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { getSummaryData, SummaryData } from '@/lib/supabase/queries'

export function useSummaryData(refreshTrigger: number) {
  const { user } = useAuth()
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSummaryData = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const data = await getSummaryData(user.id)
      setSummaryData(data)
    } catch (error) {
      console.error('Error loading summary data:', error)
      setError(error instanceof Error ? error.message : 'Error loading summary data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadSummaryData()
    }
  }, [user, refreshTrigger])

  return {
    summaryData,
    loading,
    error,
    refetch: loadSummaryData
  }
} 