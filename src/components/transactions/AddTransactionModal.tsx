'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { TransactionForm, type TransactionFormData } from '@/components/forms/TransactionForm'
import { transactionService } from '@/lib/services/transaction.service'
import { useAuth } from '@/components/providers/AuthProvider'

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onTransactionAdded: () => void
}

export default function AddTransactionModal({ 
  isOpen, 
  onClose, 
  onTransactionAdded 
}: AddTransactionModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: TransactionFormData) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      await transactionService.createTransaction(user.id, formData)
      onTransactionAdded()
      onClose()
    } catch (error) {
      console.error('Error adding transaction:', error)
      setError(error instanceof Error ? error.message : 'Error al agregar transacción')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setError(null)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Add Transaction"
      size="md"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <TransactionForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </Modal>
  )
} 