'use client'

import { useMemo, useState } from 'react'
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
}

interface FoodFormProps {
  onSubmit: (data: FoodFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  initialData?: Partial<FoodFormData>
}

export function FoodForm({
  onSubmit,
  onCancel,
  loading = false,
  initialData
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
    ...initialData
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalWeight = useMemo(() => {
    const units = Number(formData.units) || 0
    const unitWeight = Number(formData.unit_weight) || 0
    return units * unitWeight
  }, [formData.units, formData.unit_weight])

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = t('form.validation.name.required')
    }

    if (!formData.category) {
      newErrors.category = t('form.validation.category.required')
    }

    if (!formData.units || formData.units <= 0) {
      newErrors.units = t('form.validation.units.required')
    }

    if (!formData.unit_weight || formData.unit_weight <= 0) {
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label={t('form.food.weightUnit')}
          options={weightUnitOptions}
          value={formData.weight_unit}
          onChange={(e) => setFormData(prev => ({ ...prev, weight_unit: e.target.value as FoodFormData['weight_unit'] }))}
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

      <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
        <div className="font-medium text-gray-900">{t('form.food.totalWeight')}</div>
        <div className="mt-1 text-base font-semibold text-gray-900">
          {totalWeight > 0 ? totalWeight.toFixed(2) : '0.00'} {formData.weight_unit || 'g'}
        </div>
        <div className="text-xs text-gray-500">{t('form.food.totalWeight.helper')}</div>
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
          {loading ? t('form.food.adding') : t('add')}
        </Button>
      </div>
    </form>
  )
}
