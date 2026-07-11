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
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider leading-tight">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Loading Left Panel: Flow */}
        <div className="lg:col-span-7 xl:col-span-8 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
          <div className="h-4 w-32 bg-gray-200 rounded mb-3 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-[140px] animate-pulse" />
            ))}
          </div>
        </div>

        {/* Loading Right Panel: Capital */}
        <div className="lg:col-span-5 xl:col-span-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
          <div className="h-4 w-32 bg-gray-200 rounded mb-3 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-[140px] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const netIsPositive = summaryData.netBalance.ARS >= 0 && summaryData.netBalance.USD >= 0

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left Panel: Flow metrics */}
        <div className="lg:col-span-7 xl:col-span-8 bg-gray-50/50 p-4 rounded-2xl border border-gray-200/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            {t('dashboard.sections.monthly_flow')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
          </div>
        </div>

        {/* Right Panel: Patrimonial metrics */}
        <div className="lg:col-span-5 xl:col-span-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-200/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            {t('dashboard.sections.capital_position')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title={t('dashboard.net.balance')}
              ars={summaryData.netBalance.ARS}
              usd={summaryData.netBalance.USD}
              icon="#"
              colorClass={netIsPositive ? 'text-violet-600' : 'text-orange-600'}
              bgClass={netIsPositive ? 'bg-blue-50' : 'bg-orange-50'}
            />

            <StatCard
              title={t('dashboard.committed.capital')}
              ars={summaryData.committedCapital.ARS}
              usd={summaryData.committedCapital.USD}
              icon="!"
              colorClass="text-pink-600"
              bgClass="bg-pink-50"
            />

            <StatCard
              title={t('dashboard.available.capital')}
              ars={summaryData.availableCapital.ARS}
              usd={summaryData.availableCapital.USD}
              icon="✓"
              colorClass="text-teal-600"
              bgClass="bg-teal-50"
            />
          </div>
        </div>
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