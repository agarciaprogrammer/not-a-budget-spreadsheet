'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { TransactionForm, type TransactionFormData } from '@/components/forms/TransactionForm'
import { transactionService } from '@/lib/services/transaction.service'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTranslation } from '@/hooks/useTranslation'

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
  const { t } = useTranslation()

  const handleSubmit = async (formData: TransactionFormData) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      await transactionService.createTransaction(user.id, formData)
      onTransactionAdded()
      onClose()
    } catch (error: any) {
      console.error('Error adding transaction:', error)
      const message = error?.message || error?.details || t('transactions.add.error')
      setError(message)
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
      title={t('transactions.add.title')}
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