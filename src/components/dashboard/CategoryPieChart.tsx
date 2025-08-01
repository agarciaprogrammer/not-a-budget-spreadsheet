'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useCategoryBreakdown } from '@/hooks/useCategoryBreakdown'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Card, CardHeader, CardContent } from '@/components/layout/Card'
import DashboardChartCard from './DashboardChartCard'

interface CategoryPieChartProps {
  refreshTrigger: number
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    payload: {
      name: string
      value: number
      percentage: number
    }
  }>
}

interface LegendProps {
  payload?: Array<{
    value: string
    color: string
  }>
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(amount)
}

const formatPercentage = (percentage: number) => {
  return `${percentage.toFixed(1)}%`
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600">
          Amount: {formatCurrency(data.value)}
        </p>
        <p className="text-sm text-gray-600">
          Percentage: {formatPercentage(data.percentage)}
        </p>
      </div>
    )
  }
  return null
}

const CustomLegend = ({ payload }: LegendProps) => {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {payload?.map((entry, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-700">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function CategoryPieChart({ refreshTrigger }: CategoryPieChartProps) {
  const { breakdownData, loading, error } = useCategoryBreakdown(refreshTrigger)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Category Breakdown</h3>
        </CardHeader>
        <CardContent>
          <LoadingState message="Loading category data..." className="h-64" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Category Breakdown</h3>
        </CardHeader>
        <CardContent>
          <ErrorState 
            title="Error Loading Data"
            message={error}
            className="h-64"
          />
        </CardContent>
      </Card>
    )
  }

  if (breakdownData.categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Category Breakdown</h3>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <span className="text-4xl mb-2">📊</span>
            <p className="text-lg font-medium">No expenses this month</p>
            <p className="text-sm">Add some transactions to see your category breakdown</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <DashboardChartCard
      title="Category Breakdown"
      subtitle={`Total: ${formatCurrency(breakdownData.totalAmount)}`}
      loading={loading}
      error={error}
      isEmpty={breakdownData.categories.length === 0}
      emptyMessage="No expenses this month"
      noPadding={false}
      showHeader={true}
    >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={breakdownData.categories}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {breakdownData.categories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </DashboardChartCard>
  )
} 