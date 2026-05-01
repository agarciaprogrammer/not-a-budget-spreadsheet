'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useDashboardDate } from '@/components/providers/DashboardDateProvider'
import { transactionService, type Transaction } from '@/lib/services/transaction.service'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorAlert } from '@/components/ui/ErrorState'
import { EmptyTransactions } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { useTranslation } from '@/hooks/useTranslation'
import { useCategoryTranslation } from '@/hooks/useCategoryTranslation'
import EditTransactionModal from '@/components/transactions/EditTransactionModal'

interface TransactionTableProps {
  refreshTrigger: number
  onAddTransaction: () => void
  onRefresh?: () => void
}

const getTypeBadgeStyles = (type: Transaction['type']) => {
  switch (type) {
    case 'income':
      return 'bg-green-100 text-green-800'
    case 'expense':
      return 'bg-red-100 text-red-800'
    case 'transfer':
      return 'bg-blue-100 text-blue-800'
    case 'adjustment':
      return 'bg-slate-100 text-slate-800'
  }
}

export default function TransactionTable({ refreshTrigger, onAddTransaction, onRefresh }: TransactionTableProps) {
  const { user } = useAuth()
  const { monthRange } = useDashboardDate()
  const { t } = useTranslation()
  const { translateCategoryName } = useCategoryTranslation()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const loadTransactions = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const result = await transactionService.getUserTransactions(user.id, {
        page,
        pageSize,
        dateRange: {
          startDate: monthRange.startDate,
          endDate: monthRange.endDate,
        },
      })
      setTransactions(result.data)
      setTotal(result.total)
    } catch (loadError) {
      console.error('Error loading transactions:', loadError)
      setError(loadError instanceof Error ? loadError.message : t('transactions.load.error'))
    } finally {
      setLoading(false)
    }
  }, [user, monthRange, page, pageSize, t])

  useEffect(() => {
    if (user) {
      loadTransactions()
    }
  }, [user, refreshTrigger, loadTransactions])

  useEffect(() => {
    setPage(1)
  }, [monthRange])

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedTransaction(null)
  }

  const deleteTransaction = async (transactionId: string) => {
    if (!user || !confirm(t('transactions.delete.confirm'))) {
      return
    }

    try {
      await transactionService.deleteTransaction(transactionId, user.id)
      if (onRefresh) {
        onRefresh()
      }
    } catch (deleteError) {
      console.error('Error deleting transaction:', deleteError)
      alert(t('transactions.delete.error'))
    }
  }

  const getTypeLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'income':
        return t('transactions.type.income')
      case 'expense':
        return t('transactions.type.expense')
      case 'transfer':
        return t('transactions.type.transfer')
      case 'adjustment':
        return t('transactions.type.adjustment')
    }
  }

  const getCategoryLabel = (transaction: Transaction) => {
    if (!transaction.categories?.name) {
      return '-'
    }

    return translateCategoryName(transaction.categories.name)
  }

  const getAmountDisplay = (transaction: Transaction) => {
    if (transaction.type === 'transfer') {
      return (
        <div className="space-y-1">
          <div className="text-blue-700">
            {formatCurrency(transaction.from_amount ?? 0, transaction.from_currency ?? 'ARS')}
          </div>
          <div className="text-gray-500">
            {formatCurrency(transaction.to_amount ?? 0, transaction.to_currency ?? 'USD')}
          </div>
        </div>
      )
    }

    return formatCurrency(transaction.amount ?? 0, transaction.currency ?? 'ARS')
  }

  const getAmountClassName = (transaction: Transaction) => {
    if (transaction.type === 'income') {
      return 'text-green-600'
    }

    if (transaction.type === 'expense') {
      return 'text-red-600'
    }

    if (transaction.type === 'adjustment') {
      return (transaction.amount ?? 0) >= 0 ? 'text-emerald-600' : 'text-orange-600'
    }

    return 'text-blue-600'
  }

  if (loading) {
    return <LoadingState message={t('transactions.loading')} />
  }

  if (error) {
    return <ErrorAlert message={error} />
  }

  if (transactions.length === 0) {
    return <EmptyTransactions onAddTransaction={onAddTransaction} />
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('transactions.table.date')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('transactions.table.description')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('transactions.table.category')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('transactions.table.type')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('transactions.table.amount')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('transactions.table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">
                  {formatDate(transaction.date)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {transaction.description || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {getCategoryLabel(transaction)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeStyles(transaction.type)}`}>
                    {getTypeLabel(transaction.type)}
                  </span>
                </td>
                <td className={`px-4 py-3 text-sm font-medium ${getAmountClassName(transaction)}`}>
                  {getAmountDisplay(transaction)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTransaction(transaction)}
                      className="text-blue-600 hover:text-blue-900"
                      title={t('transactions.edit.title')}
                    >
                      {t('edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTransaction(transaction.id)}
                      className="text-red-600 hover:text-red-900"
                      title={t('transactions.delete.title')}
                    >
                      {t('delete')}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={setPage}
        className="mt-6"
      />

      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onTransactionUpdated={onRefresh || loadTransactions}
        transaction={selectedTransaction}
      />
    </div>
  )
}
