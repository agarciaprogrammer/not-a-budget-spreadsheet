'use client'

import { useMemo } from 'react'
import { Card, CardHeader, CardContent } from '@/components/layout/Card'
import { useTranslation } from '@/hooks/useTranslation'

interface NutritionChartProps {
  refreshTrigger: number
}

export default function NutritionChart({ refreshTrigger }: NutritionChartProps) {
  const { t } = useTranslation()

  const chartData = useMemo(() => {
    // TODO: Replace placeholder chart data with data from food services.
    return {
      calories: [420, 560, 380, 610, 520],
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    }
  }, [refreshTrigger])

  return (
    <Card>
      <CardHeader>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('food.chart.title')}</h3>
          <p className="text-sm text-gray-500 mt-1">{t('food.chart.subtitle')}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-500">{t('food.chart.placeholder')}</p>
          <p className="text-xs text-gray-400 mt-2">
            {chartData.labels.join(' · ')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
