'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'

type IngredientStatus = 'ok' | 'low' | 'restock'

interface IngredientRow {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  storage: 'fridge' | 'freezer' | 'pantry'
  status: IngredientStatus
}

const mockIngredients: IngredientRow[] = [
  {
    id: 'ing-1',
    name: 'Cherry Tomatoes',
    category: 'Produce',
    quantity: 12,
    unit: 'pcs',
    storage: 'fridge',
    status: 'ok'
  },
  {
    id: 'ing-2',
    name: 'Greek Yogurt',
    category: 'Dairy',
    quantity: 1,
    unit: 'tub',
    storage: 'fridge',
    status: 'low'
  },
  {
    id: 'ing-3',
    name: 'Brown Rice',
    category: 'Grains',
    quantity: 2,
    unit: 'kg',
    storage: 'pantry',
    status: 'ok'
  },
  {
    id: 'ing-4',
    name: 'Salmon Fillets',
    category: 'Protein',
    quantity: 3,
    unit: 'pcs',
    storage: 'freezer',
    status: 'restock'
  },
  {
    id: 'ing-5',
    name: 'Olive Oil',
    category: 'Pantry',
    quantity: 0.5,
    unit: 'L',
    storage: 'pantry',
    status: 'low'
  }
]

interface FoodTableProps {
  refreshTrigger: number
}

export default function FoodTable({ refreshTrigger }: FoodTableProps) {
  const { t } = useTranslation()

  const ingredients = useMemo(() => mockIngredients, [refreshTrigger])

  const statusStyles: Record<IngredientStatus, string> = {
    ok: 'bg-emerald-100 text-emerald-800',
    low: 'bg-amber-100 text-amber-800',
    restock: 'bg-rose-100 text-rose-800'
  }

  const storageLabels = {
    fridge: t('food.storage.fridge'),
    freezer: t('food.storage.freezer'),
    pantry: t('food.storage.pantry')
  }

  const statusLabels = {
    ok: t('food.status.ok'),
    low: t('food.status.low'),
    restock: t('food.status.restock')
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
          {ingredients.map((ingredient) => (
            <tr key={ingredient.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900 font-medium">{ingredient.name}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{ingredient.category}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{ingredient.quantity}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{ingredient.unit}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{storageLabels[ingredient.storage]}</td>
              <td className="px-4 py-3 text-sm">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[ingredient.status]}`}>
                  {statusLabels[ingredient.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" title={t('food.inventory.actions.edit')}>
                    {t('food.inventory.actions.edit')}
                  </Button>
                  <Button variant="ghost" size="sm" title={t('food.inventory.actions.consume')}>
                    {t('food.inventory.actions.consume')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    title={t('food.inventory.actions.delete')}
                  >
                    {t('food.inventory.actions.delete')}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
