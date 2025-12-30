'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select, type SelectOption } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'

export interface FoodFormData {
  name: string
  category: string
  units: number
  unit_weight: number
  weight_unit: 'g' | 'kg' | 'ml' | 'l' | 'unidad'
  storage: 'fridge' | 'freezer' | 'pantry'
  status: 'ok' | 'low' | 'restock'
  opened?: boolean
  remaining_level?: 'full' | 'half' | 'low'
  notes?: string
}

interface FoodFormProps {
  onSubmit: (data: FoodFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  initialData?: Partial<FoodFormData>
  submitLabel?: string
  loadingLabel?: string
}

export function FoodForm({
  onSubmit,
  onCancel,
  loading = false,
  initialData,
  submitLabel,
  loadingLabel
}: FoodFormProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<FoodFormData>({
    name: '',
    category: '',
    units: 0,
    unit_weight: 0,
    weight_unit: 'g',
    storage: 'fridge',
    status: 'ok',
    opened: false,
    remaining_level: undefined,
    notes: undefined,
    ...initialData
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const categoryOptions: SelectOption[] = [
    { value: 'secos', label: t('food.categories.secos') },
    { value: 'condimentos', label: t('food.categories.condimentos') },
    { value: 'dulces', label: t('food.categories.dulces') },
    { value: 'lacteos', label: t('food.categories.lacteos') },
    { value: 'proteinas', label: t('food.categories.proteinas') },
    { value: 'verduras', label: t('food.categories.verduras') },
    { value: 'panificados', label: t('food.categories.panificados') },
    { value: 'bebidas', label: t('food.categories.bebidas') },
    { value: 'cafe', label: t('food.categories.cafe') },
    { value: 'otros', label: t('food.categories.otros') }
  ]

  const weightUnitOptions: SelectOption[] = [
    { value: 'g', label: t('food.weightUnits.g') },
    { value: 'kg', label: t('food.weightUnits.kg') },
    { value: 'ml', label: t('food.weightUnits.ml') },
    { value: 'l', label: t('food.weightUnits.l') },
    { value: 'unidad', label: t('food.weightUnits.unidad') }
  ]

  const storageOptions: SelectOption[] = [
    { value: 'fridge', label: t('food.storage.fridge') },
    { value: 'freezer', label: t('food.storage.freezer') },
    { value: 'pantry', label: t('food.storage.pantry') }
  ]

  const statusOptions: SelectOption[] = [
    { value: 'ok', label: t('food.status.ok') },
    { value: 'low', label: t('food.status.low') },
    { value: 'restock', label: t('food.status.restock') }
  ]

  const remainingLevelOptions: SelectOption[] = [
    { value: 'full', label: t('food.form.remaining_level.full') },
    { value: 'half', label: t('food.form.remaining_level.half') },
    { value: 'low', label: t('food.form.remaining_level.low') }
  ]

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    const isUnitWeightRequired = formData.weight_unit !== 'unidad'

    if (!formData.name.trim()) {
      newErrors.name = t('form.validation.name.required')
    }

    if (!formData.category) {
      newErrors.category = t('form.validation.category.required')
    }

    if (!formData.units || formData.units <= 0) {
      newErrors.units = t('form.validation.units.required')
    }

    if (isUnitWeightRequired && (!formData.unit_weight || formData.unit_weight <= 0)) {
      newErrors.unit_weight = t('form.validation.unitWeight.required')
    }

    if (!formData.weight_unit) {
      newErrors.weight_unit = t('form.validation.weightUnit.required')
    }

    if (!formData.storage) {
      newErrors.storage = t('form.validation.storage.required')
    }

    if (!formData.status) {
      newErrors.status = t('form.validation.status.required')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={t('form.food.name')}
        type="text"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        error={errors.name}
        placeholder={t('form.food.name.placeholder')}
        required
      />

      <Select
        label={t('form.food.category')}
        options={categoryOptions}
        value={formData.category}
        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
        error={errors.category}
        placeholder={t('form.food.category.placeholder')}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('form.food.units')}
          type="number"
          min="0"
          step="1"
          value={formData.units || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, units: parseFloat(e.target.value) || 0 }))}
          error={errors.units}
          required
        />

        {formData.weight_unit !== 'unidad' && (
          <Input
            label={t('form.food.unitWeight')}
            type="number"
            min="0"
            step="0.01"
            value={formData.unit_weight || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, unit_weight: parseFloat(e.target.value) || 0 }))}
            error={errors.unit_weight}
            required
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label={t('form.food.weightUnit')}
          options={weightUnitOptions}
          value={formData.weight_unit}
          onChange={(e) => setFormData(prev => {
            const nextWeightUnit = e.target.value as FoodFormData['weight_unit']
            return {
              ...prev,
              weight_unit: nextWeightUnit,
              unit_weight: nextWeightUnit === 'unidad' ? 0 : prev.unit_weight
            }
          })}
          error={errors.weight_unit}
          required
        />

        <Select
          label={t('form.food.storage')}
          options={storageOptions}
          value={formData.storage}
          onChange={(e) => setFormData(prev => ({ ...prev, storage: e.target.value as FoodFormData['storage'] }))}
          error={errors.storage}
          required
        />
      </div>

      <Select
        label={t('form.food.status')}
        options={statusOptions}
        value={formData.status}
        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as FoodFormData['status'] }))}
        error={errors.status}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-2 pt-2">
          <input
            id="food-opened"
            type="checkbox"
            checked={Boolean(formData.opened)}
            onChange={(e) => setFormData(prev => ({ ...prev, opened: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="food-opened" className="text-sm font-medium text-gray-700">
            {t('food.form.opened')}
          </label>
        </div>

        <Select
          label={t('food.form.remaining_level')}
          options={remainingLevelOptions}
          value={formData.remaining_level || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            remaining_level: e.target.value ? (e.target.value as FoodFormData['remaining_level']) : undefined
          }))}
          placeholder={t('food.form.remaining_level.placeholder')}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('food.form.notes')}
        </label>
        <textarea
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 min-h-[96px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={t('food.form.notes.placeholder')}
          value={formData.notes || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            notes: e.target.value ? e.target.value : undefined
          }))}
        />
      </div>

      <div className="flex space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          {t('cancel')}
        </Button>
        <Button
          type="submit"
          loading={loading}
          className="flex-1"
        >
          {loading ? (loadingLabel || t('form.food.adding')) : (submitLabel || t('add'))}
        </Button>
      </div>
    </form>
  )
}
