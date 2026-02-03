'use client'

import { useSummaryData } from '@/hooks/useSummaryData'
import { useTranslation } from '@/hooks/useTranslation'

interface SummaryCardsProps {
  refreshTrigger: number
}

export default function SummaryCards({ refreshTrigger }: SummaryCardsProps) {
  const { summaryData, loading, error } = useSummaryData(refreshTrigger)
  const { t } = useTranslation()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center">
              <div className="p-2 bg-gray-200 rounded-lg w-12 h-12"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('dashboard.error')}</p>
                <p className="text-lg font-semibold text-gray-400">--</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* Total Income Card */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <span className="text-2xl">💰</span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{t('dashboard.total.income')}</p>
            <p className="text-2xl font-semibold text-green-600">
              {formatCurrency(summaryData.totalIncome)}
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Expenses Card */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
        <div className="flex items-center">
          <div className="p-2 bg-amber-100 rounded-lg">
            <span className="text-2xl">🧾</span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{t('dashboard.total.fixed.expenses')}</p>
            <p className="text-2xl font-semibold text-amber-600">
              {formatCurrency(summaryData.totalFixedExpenses)}
            </p>
          </div>
        </div>
      </div>

      {/* Variable Expenses Card */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
        <div className="flex items-center">
          <div className="p-2 bg-red-100 rounded-lg">
            <span className="text-2xl">💸</span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{t('dashboard.total.variable.expenses')}</p>
            <p className="text-2xl font-semibold text-red-600">
              {formatCurrency(summaryData.totalVariableExpenses)}
            </p>
          </div>
        </div>
      </div>

      {/* Net Balance Card */}
      <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${
        summaryData.netBalance >= 0 ? 'border-blue-500' : 'border-orange-500'
      }`}>
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${
            summaryData.netBalance >= 0 ? 'bg-blue-100' : 'bg-orange-100'
          }`}>
            <span className="text-2xl">📊</span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{t('dashboard.net.balance')}</p>
            <p className={`text-2xl font-semibold ${
              summaryData.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`}>
              {formatCurrency(summaryData.netBalance)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 
