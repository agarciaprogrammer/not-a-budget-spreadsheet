'use client'

import { useMemo } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useIngredients } from '@/hooks/useIngredients'
import { ingredientService } from '@/lib/services/ingredient.service'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorAlert } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'

interface IngredientsTableProps {
  refreshTrigger: number
  onRefresh?: () => void
}

export default function IngredientsTable({ refreshTrigger, onRefresh }: IngredientsTableProps) {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { ingredients, loading, error } = useIngredients(user?.id || '', refreshTrigger)

  const statusStyles = useMemo(() => ({
    ok: 'bg-emerald-100 text-emerald-800',
    low: 'bg-amber-100 text-amber-800',
    restock: 'bg-rose-100 text-rose-800'
  }), [])

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
              {t('food.inventory.table.totalWeight')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('food.inventory.table.storage')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('food.inventory.table.status')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('food.inventory.table.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {ingredients.map((ingredient) => {
            const totalWeight = Number(ingredient.units) * Number(ingredient.unit_weight)
            return (
              <tr key={ingredient.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{ingredient.name}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{ingredient.category}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {totalWeight.toFixed(2)} {ingredient.weight_unit}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{t(`food.storage.${ingredient.storage}`)}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[ingredient.status]}`}>
                    {t(`food.status.${ingredient.status}`)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(ingredient.id)}
                    className="text-red-600 hover:text-red-700"
                    title={t('food.inventory.actions.delete')}
                  >
                    {t('food.inventory.actions.delete')}
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
