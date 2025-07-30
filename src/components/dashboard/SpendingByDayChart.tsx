'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useSpendingByDay } from '@/hooks/useSpendingByDay'
import DashboardChartCard from './DashboardChartCard'

interface SpendingByDayChartProps {
  refreshTrigger: number
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: {
      date: string
    }
  }>
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(amount)
}

// Parse YYYY-MM-DD as local date to avoid timezone issues
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day) // month is 0-indexed
}

const formatDate = (dateString: string) => {
  const date = parseLocalDate(dateString)
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    const date = data.payload.date
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{formatDate(date)}</p>
        <p className="text-sm text-red-600">
          Total Spent: {formatCurrency(data.value)}
        </p>
      </div>
    )
  }
  return null
}

export default function SpendingByDayChart({ refreshTrigger }: SpendingByDayChartProps) {
  const { spendingData, loading, error } = useSpendingByDay(refreshTrigger)
  
  const isEmpty = !loading && !error && spendingData.data.length === 0

  return (
    <DashboardChartCard
      title="Spending - Last 7 Days"
      subtitle={`Total: ${formatCurrency(spendingData.totalSpent)}`}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="No expenses in the last 7 days"
      noPadding={false}
      showHeader={true}
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={spendingData.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => {
                const date = parseLocalDate(value)
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
                return `${dayName}`
              }}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="totalSpent"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              name="Total Spent"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardChartCard>
  )
} 