'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

import { useIncomeExpenseHistory } from '@/hooks/useIncomeExpenseHistory'
import DashboardChartCard from './DashboardChartCard'
import { useTranslation } from '@/hooks/useTranslation'

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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatMonth = (monthKey: string) => {
  const [year, month] = monthKey.split('-')

  const date = new Date(
    parseInt(year),
    parseInt(month) - 1
  )

  return date.toLocaleDateString('en-US', {
    month: 'short',
  })
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps) => {
  if (!active || !payload?.length) {
    return null
  }

  const income = payload.find(
    (p) => p.dataKey === 'income'
  )

  const expense = payload.find(
    (p) => p.dataKey === 'expense'
  )

  const savings = payload.find(
    (p) => p.dataKey === 'savings'
  )

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold mb-2">
        {label}
      </p>

      {income && (
        <p className="text-green-600 text-sm">
          Income: {formatCurrency(income.value)}
        </p>
      )}

      {expense && (
        <p className="text-red-600 text-sm">
          Expenses: {formatCurrency(expense.value)}
        </p>
      )}

      {savings && (
        <p className={`text-sm ${
          savings.value >= 0
            ? 'text-blue-600'
            : 'text-orange-600'
        }`}>
          Savings: {formatCurrency(savings.value)}
        </p>
      )}
    </div>
  )
}

export default function IncomeExpenseLineChart({
  refreshTrigger,
}: IncomeExpenseLineChartProps) {
  const {
    historyData,
    loading,
    error,
  } = useIncomeExpenseHistory(
    refreshTrigger,
    6
  )

  useTranslation()

  const isEmpty =
    !loading &&
    !error &&
    historyData.data.length === 0

  return (
    <DashboardChartCard
      title="Income, Expenses & Savings Trend"
      subtitle="Last 6 months"
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="No data available"
    >
      <div className="h-64">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart
            data={historyData.data}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
            />

            <XAxis
              dataKey="month"
              tickFormatter={
                formatMonth
              }
              tick={{
                fontSize: 12,
              }}
              stroke="#6b7280"
            />

            <YAxis
              tickFormatter={
                formatCurrency
              }
              tick={{
                fontSize: 12,
              }}
              stroke="#6b7280"
            />

            <Tooltip
              content={
                <CustomTooltip />
              }
            />

            <Legend />

            <Line
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              strokeWidth={3}
              dot={{
                r: 4,
              }}
              name="Income"
            />

            <Line
              type="monotone"
              dataKey="expense"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{
                r: 4,
              }}
              name="Expenses"
            />

            <Line
              type="monotone"
              dataKey="savings"
              stroke="#2563eb"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{
                r: 3,
              }}
              name="Savings"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DashboardChartCard>
  )
}