'use client'

import { useState } from 'react'
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
import SpendingByDayChart from '@/components/dashboard/SpendingByDayChart'
import { DashboardDateProvider } from '@/components/providers/DashboardDateProvider'
import MonthSelector from '@/components/dashboard/MonthSelector'

export default function DashboardPage() {
  const { user, loading, error } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

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
    return <LoadingState message="Loading dashboard..." className="min-h-screen" />
  }

  if (error) {
    return (
      <ErrorState 
        title="Authentication Error"
        message={error}
        className="min-h-screen"
      />
    )
  }

  if (!user) {
    return (
      <ErrorState 
        title="Access Denied"
        message="You must be logged in to view the dashboard."
        className="min-h-screen"
      />
    )
  }

  return (
    <DashboardDateProvider>
      <PageContainer>
        <DashboardHeader />
        <MonthSelector />
        <SummaryCards refreshTrigger={refreshTrigger} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-8">
          <CategoryPieChart refreshTrigger={refreshTrigger} />
          <IncomeExpenseLineChart refreshTrigger={refreshTrigger} />
          <SpendingByDayChart refreshTrigger={refreshTrigger} />
        </div>
        
        <TransactionsPanel
          onOpenModal={handleOpenModal}
          refreshTrigger={refreshTrigger}
          onAddTransaction={handleOpenModal}
          onRefresh={handleTransactionAdded}
        />

        <AddTransactionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onTransactionAdded={handleTransactionAdded}
        />
      </PageContainer>
    </DashboardDateProvider>
  )
}

function DashboardHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">
        Welcome!
      </h1>
      <p className="text-gray-600 mt-2">
        Manage your budget and track your transactions
      </p>
    </div>
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
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
          <Button onClick={onOpenModal}>
            + Add Transaction
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
