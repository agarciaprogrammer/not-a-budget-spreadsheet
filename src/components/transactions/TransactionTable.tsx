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

interface TransactionTableProps {
  refreshTrigger: number
  onAddTransaction: () => void
  onRefresh?: () => void
}

export default function TransactionTable({ refreshTrigger, onAddTransaction, onRefresh }: TransactionTableProps) {
  const { user } = useAuth()
  const { monthRange } = useDashboardDate()
  const { t } = useTranslation()
  const { translateCategoryName } = useCategoryTranslation()
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          endDate: monthRange.endDate
        }
      })
      setTransactions(result.data)
      setTotal(result.total)
    } catch (error) {
      console.error('Error loading transactions:', error)
      setError(error instanceof Error ? error.message : t('transactions.load.error'))
    } finally {
      setLoading(false)
    }
  }, [user, monthRange, page, pageSize, t])

  useEffect(() => {
    if (user) {
      loadTransactions()
    }
  }, [user, refreshTrigger, loadTransactions])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [monthRange])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const deleteTransaction = async (transactionId: string) => {
    if (!user || !confirm(t('transactions.delete.confirm'))) {
      return
    }

    try {
      await transactionService.deleteTransaction(transactionId, user.id)
      // Trigger refresh instead of calling loadTransactions directly
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert(t('transactions.delete.error'))
    }
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
                  {/* Acceder a la categoría a través de la relación */}
                  {translateCategoryName((transaction as Transaction & { categories?: { name: string } }).categories?.name || t('transactions.table.unknown'))}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    transaction.type === 'income' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.type === 'income' ? t('transactions.type.income') : t('transactions.type.expense')}
                  </span>
                </td>
                <td className={`px-4 py-3 text-sm font-medium ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTransaction(transaction.id)}
                    className="text-red-600 hover:text-red-900"
                    title={t('transactions.delete.title')}
                  >
                    🗑️
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        className="mt-6"
      />
    </div>
  )
} 