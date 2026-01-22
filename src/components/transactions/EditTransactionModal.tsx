'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { TransactionForm, type TransactionFormData } from '@/components/forms/TransactionForm'
import { transactionService, type Transaction } from '@/lib/services/transaction.service'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTranslation } from '@/hooks/useTranslation'

interface EditTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onTransactionUpdated: () => void
  transaction: Transaction | null
}

export default function EditTransactionModal({
  isOpen,
  onClose,
  onTransactionUpdated,
  transaction
}: EditTransactionModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  const handleSubmit = async (formData: TransactionFormData) => {
    if (!user || !transaction) return

    setLoading(true)
    setError(null)

    try {
      await transactionService.updateTransaction(transaction.id, user.id, formData)
      onTransactionUpdated()
      onClose()
    } catch (error) {
      console.error('Error updating transaction:', error)
      setError(error instanceof Error ? error.message : t('transactions.edit.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setError(null)
    onClose()
  }

  const initialData = transaction
    ? {
        type: transaction.type,
        amount: Number(transaction.amount),
        date: transaction.date,
        category_id: transaction.category_id,
        description: transaction.description || '',
      }
    : undefined

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={t('transactions.edit.title')}
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
        initialData={initialData}
        submitLabel={t('edit')}
        loadingLabel={t('transactions.edit.loading')}
      />
    </Modal>
  )
}
