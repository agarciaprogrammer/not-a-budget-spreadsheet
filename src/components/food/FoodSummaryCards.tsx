'use client'

import { useMemo } from 'react'
import { useFoodDate } from '@/components/providers/FoodDateProvider'
import { useTranslation } from '@/hooks/useTranslation'

interface FoodSummaryCardsProps {
  refreshTrigger: number
}

export default function FoodSummaryCards({ refreshTrigger }: FoodSummaryCardsProps) {
  const { selectedDate } = useFoodDate()
  const { t } = useTranslation()

  const summary = useMemo(() => {
    // TODO: Replace placeholder summary with data from food services.
    return {
      dailyCalories: 1850,
      weeklyAverageCalories: 1720,
      mealsLogged: 5
    }
  }, [refreshTrigger])

  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-emerald-500">
        <div className="flex items-center">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <span className="text-2xl">🥗</span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">
              {t('food.summary.daily.calories')}
            </p>
            <p className="text-2xl font-semibold text-emerald-600">
              {summary.dailyCalories} kcal
            </p>
            <p className="text-xs text-gray-400">
              {t('food.summary.for.date')} {formattedDate}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <span className="text-2xl">📅</span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">
              {t('food.summary.weekly.average')}
            </p>
            <p className="text-2xl font-semibold text-blue-600">
              {summary.weeklyAverageCalories} kcal
            </p>
            <p className="text-xs text-gray-400">
              {t('food.summary.week.label')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
        <div className="flex items-center">
          <div className="p-2 bg-orange-100 rounded-lg">
            <span className="text-2xl">🍽️</span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">
              {t('food.summary.meals.logged')}
            </p>
            <p className="text-2xl font-semibold text-orange-600">
              {summary.mealsLogged}
            </p>
            <p className="text-xs text-gray-400">
              {t('food.summary.meals.subtitle')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
