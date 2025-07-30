'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useIncomeExpenseHistory } from '@/hooks/useIncomeExpenseHistory'
import DashboardChartCard from './DashboardChartCard'

interface IncomeExpenseLineChartProps {
  refreshTrigger: number
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    dataKey: string
    value: number
  }>
  label?: string
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(amount)
}

const formatMonth = (monthKey: string) => {
  const [year, month] = monthKey.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const incomeData = payload.find((p) => p.dataKey === 'income')
    const expenseData = payload.find((p) => p.dataKey === 'expense')
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{formatMonth(label || '')}</p>
        {incomeData && (
          <p className="text-sm text-green-600">
            Income: {formatCurrency(incomeData.value)}
          </p>
        )}
        {expenseData && (
          <p className="text-sm text-red-600">
            Expense: {formatCurrency(expenseData.value)}
          </p>
        )}
      </div>
    )
  }
  return null
}

export default function IncomeExpenseLineChart({ refreshTrigger }: IncomeExpenseLineChartProps) {
  const { historyData, loading, error } = useIncomeExpenseHistory(refreshTrigger, 6)
  
  const isEmpty = !loading && !error && historyData.data.length === 0

  return (
    <DashboardChartCard
      title="Income vs Expense Over Time"
      subtitle={`Last ${historyData.monthsBack} months`}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="No transaction history available"
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={historyData.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tickFormatter={formatMonth}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              name="Income"
            />
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
              name="Expense"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DashboardChartCard>
  )
} 