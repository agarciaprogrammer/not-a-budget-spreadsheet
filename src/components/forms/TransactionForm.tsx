'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/Input'
import { Select, type SelectOption } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { transactionService, type Category } from '@/lib/services/transaction.service'
import { useAuth } from '@/components/providers/AuthProvider'
import { formatDateToYYYYMMDD } from '@/lib/utils/date-utils'
import { useTranslation } from '@/hooks/useTranslation'
import { useCategoryTranslation } from '@/hooks/useCategoryTranslation'
import { EXPENSE_KIND_REQUIRED_FROM, EXPENSE_KINDS } from '@/lib/constants'

export interface TransactionFormData {
  type: 'income' | 'expense'
  amount: number
  date: string
  category_id: string
  description: string
  expense_kind?: 'fixed' | 'variable' | null
}

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  initialData?: Partial<TransactionFormData>
  submitLabel?: string
  loadingLabel?: string
}

export function TransactionForm({ 
  onSubmit, 
  onCancel, 
  loading = false,
  initialData,
  submitLabel,
  loadingLabel
}: TransactionFormProps) {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const { t } = useTranslation()
  const { translateCategoryName } = useCategoryTranslation()
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'expense',
    amount: 0,
    date: formatDateToYYYYMMDD(new Date()),
    category_id: '',
    description: '',
    expense_kind: undefined,
    ...initialData
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const expenseKindRequired = formData.type === 'expense' && formData.date >= EXPENSE_KIND_REQUIRED_FROM

  const filteredCategories = useMemo(() => {
    if (formData.type !== 'expense') {
      return categories
    }
    if (!formData.expense_kind) {
      return categories
    }
    return categories.filter(
      (category) =>
        !category.expense_kind || category.expense_kind === formData.expense_kind
    )
  }, [categories, formData.type, formData.expense_kind])

  // Cargar categorías
  useEffect(() => {
    const loadCategories = async () => {
      if (!user) return
      
      try {
        const categories = await transactionService.getUserCategories(user.id)
        setCategories(categories)
      } catch (error) {
        console.error('Error loading categories:', error)
      }
    }

    loadCategories()
  }, [user])

  useEffect(() => {
    if (categories.length === 0 || formData.category_id) {
      return
    }

    if (filteredCategories.length > 0) {
      setFormData(prev => ({ ...prev, category_id: filteredCategories[0].id }))
    }
  }, [categories, filteredCategories, formData.category_id])

  useEffect(() => {
    if (formData.type !== 'expense' || !formData.expense_kind) {
      return
    }

    const isCurrentCategoryAllowed = filteredCategories.some(
      (category) => category.id === formData.category_id
    )

    if (!isCurrentCategoryAllowed) {
      setFormData(prev => ({ ...prev, category_id: '' }))
    }
  }, [formData.type, formData.expense_kind, formData.category_id, filteredCategories])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = t('form.validation.amount.required')
    }

    if (!formData.date) {
      newErrors.date = t('form.validation.date.required')
    }

    if (!formData.category_id) {
      newErrors.category_id = t('form.validation.category.required')
    }

    if (expenseKindRequired && !formData.expense_kind) {
      newErrors.expense_kind = t('form.validation.expenseKind.required')
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

  const categoryOptions: SelectOption[] = filteredCategories.map(category => ({
    value: category.id,
    label: translateCategoryName(category.name)
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tipo de transacción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('form.transaction.type')}
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center text-gray-700">
            <input
              type="radio"
              name="type"
              value="expense"
              checked={formData.type === 'expense'}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                type: e.target.value as 'income' | 'expense',
              }))}
              className="mr-2"
            />
            {t('form.transaction.expense')}
          </label>
          <label className="flex items-center text-gray-700">
            <input
              type="radio"
              name="type"
              value="income"
              checked={formData.type === 'income'}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                type: e.target.value as 'income' | 'expense',
                expense_kind: undefined
              }))}
              className="mr-2"
            />
            {t('form.transaction.income')}
          </label>
        </div>
      </div>

      {/* Tipo de gasto */}
      {formData.type === 'expense' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.transaction.expenseKind')}
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center text-gray-700">
              <input
                type="radio"
                name="expense_kind"
                value={EXPENSE_KINDS.FIXED}
                checked={formData.expense_kind === EXPENSE_KINDS.FIXED}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  expense_kind: e.target.value as 'fixed' | 'variable'
                }))}
                className="mr-2"
              />
              {t('form.transaction.expenseKind.fixed')}
            </label>
            <label className="flex items-center text-gray-700">
              <input
                type="radio"
                name="expense_kind"
                value={EXPENSE_KINDS.VARIABLE}
                checked={formData.expense_kind === EXPENSE_KINDS.VARIABLE}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  expense_kind: e.target.value as 'fixed' | 'variable'
                }))}
                className="mr-2"
              />
              {t('form.transaction.expenseKind.variable')}
            </label>
          </div>
          {errors.expense_kind && (
            <p className="mt-1 text-sm text-red-600">{errors.expense_kind}</p>
          )}
        </div>
      )}

      {/* Descripción */}
      <Input
        label={t('form.transaction.description')}
        type="text"
        value={formData.description || ''}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        placeholder={t('form.transaction.description.placeholder')}
      />

      {/* Fecha */}
      <Input
        label={t('form.transaction.date')}
        type="date"
        value={formData.date || ''}
        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
        error={errors.date}
        required
      />

      {/* Categoría */}
      <Select
        label={t('form.transaction.category')}
        options={categoryOptions}
        value={formData.category_id || ''}
        onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
        error={errors.category_id}
        placeholder={t('form.transaction.category.placeholder')}
        required
      />

      {/* Monto */}
      <Input
        label={t('form.transaction.amount')}
        type="number"
        step="0.01"
        min="0"
        value={formData.amount || ''}
        onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
        error={errors.amount}
        required
      />

      {/* Botones */}
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
          {loading ? (loadingLabel ?? t('form.transaction.adding')) : (submitLabel ?? t('add'))}
        </Button>
      </div>
    </form>
  )
} 
