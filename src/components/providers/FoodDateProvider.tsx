'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react'
import { formatDateToYYYYMMDD } from '@/lib/utils/date-utils'

interface FoodDayRange {
  startDate: string
  endDate: string
  startOfDay: Date
  endOfDay: Date
}

interface FoodDateContextType {
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  dayRange: FoodDayRange
  goToPreviousDay: () => void
  goToNextDay: () => void
  goToToday: () => void
}

const FoodDateContext = createContext<FoodDateContextType | undefined>(undefined)

interface FoodDateProviderProps {
  children: ReactNode
}

function getDayRange(date: Date): FoodDayRange {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const dayKey = formatDateToYYYYMMDD(date)

  return {
    startDate: dayKey,
    endDate: dayKey,
    startOfDay,
    endOfDay
  }
}

export function FoodDateProvider({ children }: FoodDateProviderProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const dayRange = useMemo(() => getDayRange(selectedDate), [selectedDate])

  const goToPreviousDay = useCallback(() => {
    setSelectedDate(prev => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() - 1)
      return newDate
    })
  }, [])

  const goToNextDay = useCallback(() => {
    setSelectedDate(prev => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + 1)
      return newDate
    })
  }, [])

  const goToToday = useCallback(() => {
    setSelectedDate(new Date())
  }, [])

  const value: FoodDateContextType = {
    selectedDate,
    setSelectedDate,
    dayRange,
    goToPreviousDay,
    goToNextDay,
    goToToday
  }

  return (
    <FoodDateContext.Provider value={value}>
      {children}
    </FoodDateContext.Provider>
  )
}

export function useFoodDate() {
  const context = useContext(FoodDateContext)
  if (context === undefined) {
    throw new Error('useFoodDate must be used within a FoodDateProvider')
  }
  return context
}
