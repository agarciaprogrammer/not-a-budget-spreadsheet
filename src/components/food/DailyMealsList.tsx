'use client'

import { useMemo } from 'react'
import { useFoodDate } from '@/components/providers/FoodDateProvider'
import { useTranslation } from '@/hooks/useTranslation'

interface DailyMealsListProps {
  refreshTrigger: number
}

interface MealItem {
  id: string
  time: string
  name: string
  calories: number
  protein: number
}

export default function DailyMealsList({ refreshTrigger }: DailyMealsListProps) {
  const { selectedDate } = useFoodDate()
  const { t } = useTranslation()

  const meals = useMemo<MealItem[]>(() => {
    // TODO: Replace placeholder meals with data from food services.
    return [
      { id: 'meal-1', time: '08:10', name: 'Oatmeal + berries', calories: 350, protein: 12 },
      { id: 'meal-2', time: '12:45', name: 'Chicken salad bowl', calories: 520, protein: 38 },
      { id: 'meal-3', time: '19:20', name: 'Salmon + roasted veggies', calories: 610, protein: 42 }
    ]
  }, [refreshTrigger])

  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  if (meals.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="text-lg font-medium">{t('food.meals.empty.title')}</p>
        <p className="text-sm mt-2">{t('food.meals.empty.subtitle')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-500">
          {t('food.meals.list.subtitle')} {formattedDate}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('food.meals.table.time')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('food.meals.table.meal')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('food.meals.table.calories')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('food.meals.table.protein')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {meals.map((meal) => (
              <tr key={meal.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{meal.time}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{meal.name}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{meal.calories} kcal</td>
                <td className="px-4 py-3 text-sm text-gray-900">{meal.protein} g</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
