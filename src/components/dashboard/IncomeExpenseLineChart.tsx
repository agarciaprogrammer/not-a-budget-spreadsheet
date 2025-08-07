'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
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
    minimumFractionDigits: 2
  }).format(amount)
}

const formatMonth = (monthKey: string) => {
  const [year, month] = monthKey.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

const formatMonthForTooltip = (monthKey: string, locale: string = 'en') => {
  const [year, month] = monthKey.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  const localeCode = locale === 'es' ? 'es-ES' : 'en-US'
  const formatted = date.toLocaleDateString(localeCode, { month: 'short', year: 'numeric' })
  
  // Capitalize first letter for Spanish
  if (locale === 'es') {
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }
  
  return formatted
}

const CustomTooltip = ({ active, payload, label, t, locale }: TooltipProps & { t: (key: string) => string, locale: string }) => {
  if (active && payload && payload.length) {
    const incomeData = payload.find((p) => p.dataKey === 'income')
    const expenseData = payload.find((p) => p.dataKey === 'expense')
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{formatMonthForTooltip(label || '', locale)}</p>
        {incomeData && (
          <p className="text-sm text-green-600">
            {t('dashboard.charts.tooltip.income')}: {formatCurrency(incomeData.value)}
          </p>
        )}
        {expenseData && (
          <p className="text-sm text-red-600">
            {t('dashboard.charts.tooltip.expense')}: {formatCurrency(expenseData.value)}
          </p>
        )}
      </div>
    )
  }
  return null
}

export default function IncomeExpenseLineChart({ refreshTrigger }: IncomeExpenseLineChartProps) {
  const { historyData, loading, error } = useIncomeExpenseHistory(refreshTrigger, 6)
  const { t, locale } = useTranslation()
  
  const isEmpty = !loading && !error && historyData.data.length === 0

  return (
    <DashboardChartCard
      title={t('dashboard.charts.income.expense.title')}
      subtitle={t('dashboard.charts.income.expense.subtitle', { months: historyData.monthsBack })}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage={t('dashboard.charts.income.expense.no.data')}
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
            <Tooltip content={<CustomTooltip t={t} locale={locale} />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              name={t('dashboard.charts.legend.income')}
            />
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
              name={t('dashboard.charts.legend.expense')}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DashboardChartCard>
  )
} 