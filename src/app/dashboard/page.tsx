'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import AddTransactionModal from '@/components/transactions/AddTransactionModal'
import TransactionTable from '@/components/transactions/TransactionTable'
import SummaryCards from '@/components/dashboard/SummaryCards'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const [username, setUsername] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Fetches the username from API based on the logged-in user
  useEffect(() => {
    async function fetchUsername() {
      if (!user) return

      try {
        const response = await fetch(`/api/profile?userId=${user.id}`)
        if (!response.ok) return

        const { username } = await response.json()
        setUsername(username)
      } catch (error) {
        console.error('Failed to fetch username:', error)
      }
    }

    fetchUsername()
  }, [user])

  // Triggered when a new transaction is added to refresh summaries and table
  const handleTransactionAdded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Renders loading state while auth is in progress
  if (loading) {
    return (
      <CenteredMessage message="Loading dashboard..." color="text-gray-500" />
    )
  }

  // Renders fallback UI for unauthenticated access
  if (!user) {
    return (
      <CenteredMessage message="You must be logged in to view the dashboard." color="text-red-500" />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader username={username} />

        <SummaryCards refreshTrigger={refreshTrigger} />

        <TransactionsPanel
          onOpenModal={() => setIsModalOpen(true)}
          refreshTrigger={refreshTrigger}
        />
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransactionAdded={handleTransactionAdded}
      />
    </div>
  )
}

/** Extracted reusable component for header display */
function DashboardHeader({ username }: { username: string | null }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">
        Welcome{username ? `, ${username}` : ''}!
      </h1>
      <p className="text-gray-600 mt-2">
        Manage your budget and track your transactions
      </p>
    </div>
  )
}

/** Displays the transaction list section */
function TransactionsPanel({
  onOpenModal,
  refreshTrigger,
}: {
  onOpenModal: () => void
  refreshTrigger: number
}) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
          <button
            onClick={onOpenModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            + Add Transaction
          </button>
        </div>
      </div>
      <div className="p-6">
        <TransactionTable refreshTrigger={refreshTrigger} />
      </div>
    </div>
  )
}

/** Displays a centered message for loading or error states */
function CenteredMessage({ message, color }: { message: string; color: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <span className={`${color} text-lg`}>{message}</span>
    </div>
  )
}
