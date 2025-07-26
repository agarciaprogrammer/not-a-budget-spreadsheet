'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  date: string
  description: string | null
  category: {
    name: string
  }
}

interface TransactionRow {
  id: string
  type: 'income' | 'expense'
  amount: number
  date: string
  description: string | null
  categories: {
    name: string
  }[]
}

interface TransactionTableProps {
  refreshTrigger: number
}

export default function TransactionTable({ refreshTrigger }: TransactionTableProps) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserSupabaseClient()

  const loadTransactions = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Obtener el budget_id del usuario
      const { data: budgetUser, error: budgetError } = await supabase
        .from('budget_users')
        .select('budget_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .single()

      if (budgetError || !budgetUser) {
        throw new Error('No budget found for user')
      }

      // Obtener transacciones con información de categoría
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          type,
          amount,
          date,
          description,
          categories(name)
        `)
        .eq('budget_id', budgetUser.budget_id)
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw error

      // Transformar los datos para que coincidan con la interfaz
      const transformedData = (data || []).map((item: TransactionRow) => ({
        id: item.id,
        type: item.type,
        amount: item.amount,
        date: item.date,
        description: item.description,
        category: {
          name: item.categories?.[0]?.name || 'Other'
        }
      }))

      setTransactions(transformedData)
    } catch (error) {
      console.error('Error loading transactions:', error)
      setError(error instanceof Error ? error.message : 'Error loading transactions')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (user) {
      loadTransactions()
    }
  }, [user, refreshTrigger, loadTransactions])

  const deleteTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', user?.id)

      if (error) throw error

      // Recargar transacciones
      loadTransactions()
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('Error deleting transaction')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Loading transactions...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        {error}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No transactions yet. Add your first transaction!
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
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
                {transaction.category?.name || 'Other'}
              </td>
              <td className="px-4 py-3 text-sm">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  transaction.type === 'income' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {transaction.type === 'income' ? 'Income' : 'Expense'}
                </span>
              </td>
              <td className={`px-4 py-3 text-sm font-medium ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatAmount(transaction.amount)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                <button
                  onClick={() => deleteTransaction(transaction.id)}
                  className="text-red-600 hover:text-red-900 cursor-pointer"
                  title="Delete transaction"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 