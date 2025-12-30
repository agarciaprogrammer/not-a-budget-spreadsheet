'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useIngredients } from '@/hooks/useIngredients'
import { ingredientService, type Ingredient } from '@/lib/services/ingredient.service'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorAlert } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { FoodForm, type FoodFormData } from '@/components/forms/FoodForm'
import { useTranslation } from '@/hooks/useTranslation'

interface IngredientsTableProps {
  refreshTrigger: number
  onRefresh?: () => void
}

export default function IngredientsTable({ refreshTrigger, onRefresh }: IngredientsTableProps) {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { ingredients, loading, error } = useIngredients(user?.id || '', refreshTrigger)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [consumingIngredient, setConsumingIngredient] = useState<Ingredient | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [consumeLoading, setConsumeLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [consumeError, setConsumeError] = useState<string | null>(null)
  const [consumeAmount, setConsumeAmount] = useState('')

  const handleDelete = async (id: string) => {
    if (!confirm(t('food.inventory.delete.confirm'))) {
      return
    }

    try {
      await ingredientService.deleteIngredient(id)
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error deleting ingredient:', error)
      alert(t('food.inventory.delete.error'))
    }
  }

  const handleEditSubmit = async (formData: FoodFormData) => {
    if (!editingIngredient) return

    setEditLoading(true)
    setEditError(null)

    try {
      await ingredientService.updateIngredient(editingIngredient.id, formData)
      setEditingIngredient(null)
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error updating ingredient:', error)
      setEditError(t('food.inventory.edit.error'))
    } finally {
      setEditLoading(false)
    }
  }

  const handleConsume = async (action?: 'delete' | 'mark-low') => {
    if (!consumingIngredient) return

    const isUnit = consumingIngredient.weight_unit === 'unidad'
    const currentUnits = Number(consumingIngredient.units) || 0
    const currentUnitWeight = Number(consumingIngredient.unit_weight) || 0

    if (isUnit && currentUnits <= 0) {
      setConsumeError(t('food.inventory.consume.error'))
      return
    }

    setConsumeLoading(true)
    setConsumeError(null)

    try {
      if (isUnit) {
        if (currentUnits === 1 && action === 'delete') {
          await ingredientService.deleteIngredient(consumingIngredient.id)
        } else {
          await ingredientService.consumeIngredient(consumingIngredient, {
            remaining_level: currentUnits === 1 && action === 'mark-low' ? 'low' : undefined
          })
        }
      } else {
        const amount = Number(consumeAmount)
        if (!amount || amount <= 0) {
          setConsumeError(t('food.inventory.consume.amount.error'))
          return
        }
        if (amount > currentUnitWeight) {
          setConsumeError(t('food.inventory.consume.amount.exceeds'))
          return
        }
        await ingredientService.consumeIngredient(consumingIngredient, { amount })
      }

      setConsumingIngredient(null)
      setConsumeAmount('')
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error consuming ingredient:', error)
      setConsumeError(t('food.inventory.consume.error'))
    } finally {
      setConsumeLoading(false)
    }
  }

  const handleCloseEditModal = () => {
    setEditingIngredient(null)
    setEditError(null)
  }

  const handleCloseConsumeModal = () => {
    setConsumingIngredient(null)
    setConsumeError(null)
    setConsumeAmount('')
  }

  if (loading) {
    return <LoadingState message={t('food.loading')} />
  }

  if (error) {
    return <ErrorAlert message={error} />
  }

  if (ingredients.length === 0) {
    return (
      <EmptyState
        title={t('food.inventory.empty.title')}
        description={t('food.inventory.empty.description')}
        icon={
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 7l2-2m-2 2l2 2m14 12H5a2 2 0 01-2-2V7m18 0v10a2 2 0 01-2 2z" />
          </svg>
        }
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('food.inventory.table.ingredient')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('food.inventory.table.category')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('food.inventory.table.quantity')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('food.inventory.table.unit')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('food.inventory.table.opened')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('food.inventory.table.storage')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('food.inventory.table.notes')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('food.inventory.table.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {ingredients.map((ingredient) => {
            const quantity = ingredient.weight_unit === 'unidad'
              ? ingredient.units
              : ingredient.unit_weight
            return (
              <tr key={ingredient.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{ingredient.name}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{ingredient.category}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{quantity}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{t(`food.weightUnits.${ingredient.weight_unit}`)}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {ingredient.opened ? t('food.inventory.opened.yes') : t('food.inventory.opened.no')}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{t(`food.storage.${ingredient.storage}`)}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{ingredient.notes || ''}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingIngredient(ingredient)}
                      title={t('food.inventory.actions.edit')}
                    >
                      {t('food.inventory.actions.edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setConsumingIngredient(ingredient)
                        setConsumeAmount('')
                        setConsumeError(null)
                      }}
                      title={t('food.inventory.actions.consume')}
                    >
                      {t('food.inventory.actions.consume')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(ingredient.id)}
                      className="text-red-600 hover:text-red-700"
                      title={t('food.inventory.actions.delete')}
                    >
                      {t('food.inventory.actions.delete')}
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <Modal
        isOpen={Boolean(editingIngredient)}
        onClose={handleCloseEditModal}
        title={t('food.inventory.edit.title')}
        size="md"
      >
        {editError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {editError}
          </div>
        )}
        {editingIngredient && (
          <FoodForm
            onSubmit={handleEditSubmit}
            onCancel={handleCloseEditModal}
            loading={editLoading}
            initialData={{
              name: editingIngredient.name,
              category: editingIngredient.category,
              units: Number(editingIngredient.units) || 0,
              unit_weight: Number(editingIngredient.unit_weight) || 0,
              weight_unit: editingIngredient.weight_unit,
              storage: editingIngredient.storage,
              status: editingIngredient.status,
              opened: Boolean(editingIngredient.opened),
              remaining_level: editingIngredient.remaining_level || undefined,
              notes: editingIngredient.notes || undefined
            }}
            submitLabel={t('save')}
            loadingLabel={t('food.inventory.edit.saving')}
          />
        )}
      </Modal>

      <Modal
        isOpen={Boolean(consumingIngredient)}
        onClose={handleCloseConsumeModal}
        title={t('food.inventory.consume.title')}
        size="sm"
      >
        {consumeError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {consumeError}
          </div>
        )}
        {consumingIngredient && (
          <div className="space-y-4">
            {consumingIngredient.weight_unit === 'unidad' ? (
              <>
                <p className="text-sm text-gray-700">
                  {t('food.inventory.consume.unit.confirm', { name: consumingIngredient.name })}
                </p>
                {consumingIngredient.units === 1 ? (
                  <p className="text-sm text-gray-500">
                    {t('food.inventory.consume.unit.last')}
                  </p>
                ) : null}
              </>
            ) : (
              <Input
                label={`${t('food.inventory.consume.amount.label')} (${t(`food.weightUnits.${consumingIngredient.weight_unit}`)})`}
                type="number"
                min="0"
                step="0.01"
                value={consumeAmount}
                onChange={(e) => setConsumeAmount(e.target.value)}
                placeholder={t('food.inventory.consume.amount.placeholder')}
              />
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseConsumeModal}
              >
                {t('cancel')}
              </Button>
              {consumingIngredient.weight_unit === 'unidad' && consumingIngredient.units === 1 ? (
                <>
                  <Button
                    type="button"
                    variant="danger"
                    loading={consumeLoading}
                    onClick={() => handleConsume('delete')}
                  >
                    {t('food.inventory.consume.delete')}
                  </Button>
                  <Button
                    type="button"
                    loading={consumeLoading}
                    onClick={() => handleConsume('mark-low')}
                  >
                    {t('food.inventory.consume.markLow')}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  loading={consumeLoading}
                  onClick={() => handleConsume()}
                >
                  {t('food.inventory.actions.consume')}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
