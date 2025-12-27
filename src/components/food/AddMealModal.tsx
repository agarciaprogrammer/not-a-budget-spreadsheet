'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'

interface AddMealModalProps {
  isOpen: boolean
  onClose: () => void
  onMealAdded: () => void
}

export default function AddMealModal({ isOpen, onClose, onMealAdded }: AddMealModalProps) {
  const { t } = useTranslation()
  const [mealName, setMealName] = useState('')
  const [mealType, setMealType] = useState('breakfast')
  const [calories, setCalories] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // TODO: Replace placeholder submit with food service integration.
    onMealAdded()
    onClose()

    setMealName('')
    setMealType('breakfast')
    setCalories('')
    setNotes('')
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('food.meals.add.title')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('food.meals.form.name')}
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder={t('food.meals.form.name.placeholder')}
            value={mealName}
            onChange={(event) => setMealName(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('food.meals.form.type')}
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={mealType}
              onChange={(event) => setMealType(event.target.value)}
            >
              <option value="breakfast">{t('food.meals.form.type.breakfast')}</option>
              <option value="lunch">{t('food.meals.form.type.lunch')}</option>
              <option value="dinner">{t('food.meals.form.type.dinner')}</option>
              <option value="snack">{t('food.meals.form.type.snack')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('food.meals.form.calories')}
            </label>
            <input
              type="number"
              min="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder={t('food.meals.form.calories.placeholder')}
              value={calories}
              onChange={(event) => setCalories(event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('food.meals.form.notes')}
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[96px]"
            placeholder={t('food.meals.form.notes.placeholder')}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit">
            {t('food.meals.add.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
