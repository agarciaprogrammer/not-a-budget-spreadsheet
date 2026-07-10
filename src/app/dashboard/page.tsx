'use client'

import { useState } from 'react'
import { useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardHeader, CardContent } from '@/components/layout/Card'
import { Button } from '@/components/ui/Button'
import AddTransactionModal from '@/components/transactions/AddTransactionModal'
import TransactionTable from '@/components/transactions/TransactionTable'
import SummaryCards from '@/components/dashboard/SummaryCards'
import CategoryPieChart from '@/components/dashboard/CategoryPieChart'
import IncomeExpenseLineChart from '@/components/dashboard/IncomeExpenseLineChart'
import WeeklySpendingChart from '@/components/dashboard/WeeklySpendingChart'
import MonthlyLimitCard from '@/components/dashboard/MonthlyLimitCard'
import { DashboardDateProvider } from '@/components/providers/DashboardDateProvider'
import MonthSelector from '@/components/dashboard/MonthSelector'
import { useTranslation } from '@/hooks/useTranslation'
import AddCommitmentModal from '@/components/transactions/AddCommitmentModal'
import CommitmentsList from '@/components/transactions/CommitmentsList'
import InstallmentsCalendar from '@/components/transactions/InstallmentsCalendar'

export default function DashboardPage() {
  const { user, loading, error } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { t } = useTranslation()

  useEffect(() => {
    const handler = () => setRefreshTrigger(prev => prev + 1)
    window.addEventListener('openingBalanceOverride:changed', handler)
    return () => window.removeEventListener('openingBalanceOverride:changed', handler)
  }, [])

  const handleTransactionAdded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  // Estados de autenticación
  if (loading) {
    return <LoadingState message={t('dashboard.loading')} className="min-h-screen" />
  }

  if (error) {
    return (
      <ErrorState 
        title={t('dashboard.auth.error.title')}
        message={error}
        className="min-h-screen"
      />
    )
  }

  if (!user) {
    return (
      <ErrorState 
        title={t('dashboard.access.denied.title')}
        message={t('dashboard.access.denied.message')}
        className="min-h-screen"
      />
    )
  }

  return (
    <DashboardDateProvider>
      <PageContainer>
        <MonthSelector />
        <SummaryCards refreshTrigger={refreshTrigger} />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 my-8">
          <CategoryPieChart refreshTrigger={refreshTrigger} />
          <IncomeExpenseLineChart refreshTrigger={refreshTrigger} />
          <WeeklySpendingChart refreshTrigger={refreshTrigger} />
        </div>
        
        {/* Monthly Limit Card */}
        <div className="my-8">
          <MonthlyLimitCard userId={user.id} refreshTrigger={refreshTrigger} />
        </div>
        
        <div className="space-y-8">
          <TransactionsPanel
            onOpenModal={handleOpenModal}
            refreshTrigger={refreshTrigger}
            onAddTransaction={handleOpenModal}
            onRefresh={handleTransactionAdded}
          />

          <CommitmentsPanel
            onOpenModal={() => setIsCommitmentModalOpen(true)}
            refreshTrigger={refreshTrigger}
            onRefresh={() => setRefreshTrigger(prev => prev + 1)}
          />
        </div>

        <AddTransactionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onTransactionAdded={handleTransactionAdded}
        />

        <AddCommitmentModal
          isOpen={isCommitmentModalOpen}
          onClose={() => setIsCommitmentModalOpen(false)}
          onCommitmentAdded={() => setRefreshTrigger(prev => prev + 1)}
        />
      </PageContainer>
    </DashboardDateProvider>
  )
}

function TransactionsPanel({
  onOpenModal,
  refreshTrigger,
  onAddTransaction,
  onRefresh,
}: {
  onOpenModal: () => void
  refreshTrigger: number
  onAddTransaction: () => void
  onRefresh: () => void
}) {
  const { t } = useTranslation()
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('dashboard.recent.transactions')}</h2>
          <Button onClick={onOpenModal}>
            + {t('transactions.add.button')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <TransactionTable 
          refreshTrigger={refreshTrigger} 
          onAddTransaction={onAddTransaction}
          onRefresh={onRefresh}
        />
      </CardContent>
    </Card>
  )
}

function CommitmentsPanel({
  onOpenModal,
  refreshTrigger,
  onRefresh,
}: {
  onOpenModal: () => void
  refreshTrigger: number
  onRefresh: () => void
}) {
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list')

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Compromisos y Cuotas</h2>
            <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Mis Compromisos
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'calendar'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Calendario de Cuotas
              </button>
            </div>
          </div>
          <Button onClick={onOpenModal}>
            + Registrar Compromiso
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'list' ? (
          <CommitmentsList 
            refreshTrigger={refreshTrigger} 
            onRefresh={onRefresh}
          />
        ) : (
          <InstallmentsCalendar 
            refreshTrigger={refreshTrigger} 
          />
        )}
      </CardContent>
    </Card>
  )
}
