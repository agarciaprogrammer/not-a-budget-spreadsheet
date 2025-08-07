'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useWeeklySpending } from '@/hooks/useWeeklySpending'
import DashboardChartCard from './DashboardChartCard'
import { useTranslation } from '@/hooks/useTranslation'

interface WeeklySpendingChartProps {
  refreshTrigger: number
}

export default function WeeklySpendingChart({ refreshTrigger }: WeeklySpendingChartProps) {
  const { spendingData, loading, error } = useWeeklySpending(refreshTrigger)
  const { t } = useTranslation()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{ value: number }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-blue-600 font-semibold">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <DashboardChartCard 
      title={t('dashboard.charts.weekly.spending.title')} 
      subtitle={`${t('dashboard.charts.total')}: ${formatCurrency(spendingData.totalSpent)}`}
      loading={loading}
      error={error}
      isEmpty={!loading && spendingData.data.length === 0}
      emptyMessage={t('dashboard.charts.weekly.spending.no.data')}
    >
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={spendingData.data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <XAxis 
            dataKey="shortLabel" 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="total" 
            fill="#3B82F6" 
            radius={[4, 4, 0, 0]}
            name="Weekly Spending"
          />
        </BarChart>
      </ResponsiveContainer>
    </DashboardChartCard>
  )
}
