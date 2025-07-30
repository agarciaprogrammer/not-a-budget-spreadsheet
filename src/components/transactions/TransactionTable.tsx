'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'

// Transaction interface defining the structure of a transaction object
// Used for type safety and consistency across the component
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

// Props interface for the TransactionTable component
// refreshTrigger: number - Used to trigger a refresh of the transaction data
interface TransactionTableProps {
  refreshTrigger: number
}

// TransactionTable Component
// Displays a table of user transactions with the ability to delete them.
// Fetches data from Supabase and handles loading states, errors, and data formatting.
// @param refreshTrigger - Number that triggers a refresh when changed
// @returns JSX element containing the transaction table or loading/error states
export default function TransactionTable({ refreshTrigger }: TransactionTableProps) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize Supabase client for database operations
  const supabase = createBrowserSupabaseClient()

  // Loads transactions for the current user from the database
  // This function:
  // 1. Gets the user's budget_id from the budget_users table
  // 2. Fetches transactions with category information using a join
  // 3. Transforms the data to match the Transaction interface
  // 4. Handles errors and loading states
  const loadTransactions = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Get the budget_id for the current user (owner role)
      const { data: budgetUser, error: budgetError } = await supabase
        .from('budget_users')
        .select('budget_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .single()

      if (budgetError || !budgetUser) {
        throw new Error('No budget found for user')
      }

      // Fetch transactions with category information using proper join
      // This query joins the transactions table with categories table
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          type,
          amount,
          date,
          description,
          categories:category_id (
            name
          )
        `)
        .eq('budget_id', budgetUser.budget_id)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      if (error) throw error

      // Transform the raw data to match our Transaction interface
      // This ensures type safety and consistent data structure
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        type: item.type,
        amount: item.amount,
        date: item.date,
        description: item.description,
        category: {
          name: item.categories?.name || 'Unknown'
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

  // Load transactions when user changes or refreshTrigger is updated
  useEffect(() => {
    if (user) {
      loadTransactions()
    }
  }, [user, refreshTrigger, loadTransactions])

  // Deletes a transaction from the database
  // @param transactionId - The ID of the transaction to delete
  // This function:
  // 1. Shows a confirmation dialog
  // 2. Deletes the transaction from the database
  // 3. Reloads the transaction list to reflect changes
  // 4. Handles errors with user feedback
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

      // Reload transactions to reflect the deletion
      loadTransactions()
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('Error deleting transaction')
    }
  }

  // Formats a date string to a localized date format
  // @param dateString - ISO date string to format
  // @returns Formatted date string in Spanish locale
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Formats a number as currency in Argentine Peso (ARS)
  // @param amount - Numeric amount to format
  // @returns Formatted currency string
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  // Loading state - shows a centered loading message
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Loading transactions...</div>
      </div>
    )
  }

  // Error state - displays error message in a red alert box
  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        {error}
      </div>
    )
  }

  // Empty state - shows message when no transactions exist
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No transactions yet. Add your first transaction!
      </div>
    )
  }

  // Main table render with all transaction data
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
                {transaction.category?.name || 'Unknown'}
              </td>
              <td className="px-4 py-3 text-sm">
                {/* Type badge with conditional styling based on transaction type */}
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
                {/* Delete button with confirmation dialog */}
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