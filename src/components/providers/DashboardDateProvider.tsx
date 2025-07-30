'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react'
import { getMonthDateRange } from '@/lib/utils/date-utils'
import type { MonthDateRange } from '@/lib/utils/date-utils'

interface DashboardDateContextType {
  selectedMonth: Date
  setSelectedMonth: (date: Date) => void
  monthRange: MonthDateRange
  goToPreviousMonth: () => void
  goToNextMonth: () => void
  goToCurrentMonth: () => void
}

const DashboardDateContext = createContext<DashboardDateContextType | undefined>(undefined)

interface DashboardDateProviderProps {
  children: ReactNode
}

export function DashboardDateProvider({ children }: DashboardDateProviderProps) {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  
  // Get the month range for the selected month
  const monthRange = useMemo(() => getMonthDateRange(selectedMonth), [selectedMonth])
  
  const goToPreviousMonth = useCallback(() => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() - 1)
      return newDate
    })
  }, [])
  
  const goToNextMonth = useCallback(() => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + 1)
      return newDate
    })
  }, [])
  
  const goToCurrentMonth = useCallback(() => {
    setSelectedMonth(new Date())
  }, [])
  
  const value: DashboardDateContextType = {
    selectedMonth,
    setSelectedMonth,
    monthRange,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth
  }
  
  return (
    <DashboardDateContext.Provider value={value}>
      {children}
    </DashboardDateContext.Provider>
  )
}

export function useDashboardDate() {
  const context = useContext(DashboardDateContext)
  if (context === undefined) {
    throw new Error('useDashboardDate must be used within a DashboardDateProvider')
  }
  return context
} 