'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { FoodForm, type FoodFormData } from '@/components/forms/FoodForm'
import { ingredientService } from '@/lib/services/ingredient.service'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTranslation } from '@/hooks/useTranslation'

interface AddIngredientModalProps {
  isOpen: boolean
  onClose: () => void
  onIngredientAdded: () => void
}

export default function AddIngredientModal({
  isOpen,
  onClose,
  onIngredientAdded
}: AddIngredientModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  const handleSubmit = async (formData: FoodFormData) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      await ingredientService.createIngredient(user.id, formData)
      onIngredientAdded()
      onClose()
    } catch (error) {
      console.error('Error adding ingredient:', error)
      setError(error instanceof Error ? error.message : t('food.inventory.add.error'))
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
      title={t('food.inventory.add')}
      size="md"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <FoodForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </Modal>
  )
}
