'use client'

import { useState } from 'react'
import { useSummaryData } from '@/hooks/useSummaryData'
import { useTranslation } from '@/hooks/useTranslation'
import { formatCurrency } from '@/lib/utils/formatters'
import EditOpeningBalanceModal from './EditOpeningBalanceModal'
import { useDashboardDate } from '@/components/providers/DashboardDateProvider'

interface CardProps {
  title: string
  ars: number
  usd?: number // Opcional
  icon: string
  colorClass: string
  bgClass: string
  onClick?: () => void
}

// Componente Atómico para la Card para asegurar consistencia total
function StatCard({ title, ars, usd, icon, colorClass, bgClass, onClick }: CardProps) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-sky-200' : ''} min-h-[140px]`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex-none w-10 h-10 rounded-lg ${bgClass} flex items-center justify-center text-xl`}>
          <span className={colorClass}>{icon}</span>
        </div>
        <p className="text-xs font-semibold text-gray-800 uppercase tracking-wider leading-tight">
          {title}
        </p>
      </div>

      <div className="space-y-1">
        {/* Línea ARS - Siempre presente */}
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 font-medium">ARS</span>
          <span className={`text-lg xl:text-xl font-bold tabular-nums truncate ${colorClass}`}>
            {formatCurrency(ars, 'ARS')}
          </span>
        </div>

        {/* Línea USD - Ocupa espacio aunque no exista para mantener alineación */}
        <div className="flex flex-col border-t border-gray-50 pt-1">
          {usd !== undefined ? (
            <>
              <span className="text-[10px] text-gray-400 font-medium">USD</span>
              <span className={`text-lg xl:text-xl font-bold tabular-nums truncate ${colorClass}`}>
                {formatCurrency(usd, 'USD')}
              </span>
            </>
          ) : (
            // El "Ghost" element: mantiene la altura pero invisible
            <div className="h-[34px] xl:h-[38px]" aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  )
}

interface SummaryCardsProps {
  refreshTrigger?: number
}

export default function SummaryCards({ refreshTrigger }: SummaryCardsProps) {
  const { summaryData, loading, error } = useSummaryData(refreshTrigger ?? 0)
  const { t } = useTranslation()
  const { selectedMonth } = useDashboardDate()
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (loading || error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-xl h-[140px] animate-pulse" />
        ))}
      </div>
    )
  }

  const netIsPositive = summaryData.netBalance.ARS >= 0 && summaryData.netBalance.USD >= 0

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <StatCard
          title={t('dashboard.opening.balance')}
          ars={summaryData.openingBalance.ARS}
          usd={summaryData.openingBalance.USD}
          icon="$"
          colorClass="text-sky-600"
          bgClass="bg-sky-50"
          onClick={() => setIsModalOpen(true)}
        />

        <StatCard
          title={t('dashboard.total.income')}
          ars={summaryData.totalIncome}
          icon="+"
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />

        <StatCard
          title={t('dashboard.total.fixed.expenses')}
          ars={summaryData.totalFixedExpenses}
          icon="="
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />

        <StatCard
          title={t('dashboard.total.variable.expenses')}
          ars={summaryData.totalVariableExpenses}
          icon="-"
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />

        <StatCard
          title={t('dashboard.net.balance')}
          ars={summaryData.netBalance.ARS}
          usd={summaryData.netBalance.USD}
          icon="#"
          colorClass={netIsPositive ? 'text-violet-600' : 'text-orange-600'}
          bgClass={netIsPositive ? 'bg-blue-50' : 'bg-orange-50'}
        />
      </div>

      <EditOpeningBalanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        year={selectedMonth.getFullYear()}
        month={selectedMonth.getMonth() + 1}
        initialARS={summaryData.openingBalance.ARS}
        initialUSD={summaryData.openingBalance.USD}
        onSaved={() => window.dispatchEvent(new CustomEvent('openingBalanceOverride:changed'))}
      />
    </>
  )
}