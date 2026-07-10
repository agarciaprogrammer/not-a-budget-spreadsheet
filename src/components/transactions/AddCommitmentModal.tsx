'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import CommitmentForm from '@/components/forms/CommitmentForm'
import { commitmentService } from '@/lib/services/commitment.service'
import { useAuth } from '@/components/providers/AuthProvider'

interface AddCommitmentModalProps {
  isOpen: boolean
  onClose: () => void
  onCommitmentAdded: () => void
}

export default function AddCommitmentModal({
  isOpen,
  onClose,
  onCommitmentAdded,
}: AddCommitmentModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: any) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      await commitmentService.createCommitment(user.id, formData)
      onCommitmentAdded()
      onClose()
    } catch (err) {
      console.error('Error adding commitment:', err)
      setError(err instanceof Error ? err.message : 'Error al guardar el compromiso')
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
      title="Registrar Nuevo Compromiso"
      size="md"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <CommitmentForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </Modal>
  )
}
