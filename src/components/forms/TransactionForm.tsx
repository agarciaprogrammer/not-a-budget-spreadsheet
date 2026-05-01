'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/Input'
import { Select, type SelectOption } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { transactionService, type Category, type CurrencyCode, type TransactionType } from '@/lib/services/transaction.service'
import { useAuth } from '@/components/providers/AuthProvider'
import { formatDateToYYYYMMDD } from '@/lib/utils/date-utils'
import { useTranslation } from '@/hooks/useTranslation'
import { useCategoryTranslation } from '@/hooks/useCategoryTranslation'
import { CURRENCIES, EXPENSE_KIND_REQUIRED_FROM, EXPENSE_KINDS, TRANSACTION_TYPES } from '@/lib/constants'
import type { TransactionFormData } from '@/validations/transaction'

interface TransactionFormState {
  type: TransactionType
  date: string
  description: string
  category_id: string
  amount: number
  currency: CurrencyCode
  expense_kind?: 'fixed' | 'variable' | ''
  from_currency: CurrencyCode
  from_amount: number
  to_currency: CurrencyCode
  to_amount: number
}

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  initialData?: Partial<TransactionFormData>
  submitLabel?: string
  loadingLabel?: string
}

const currencyOptions: SelectOption[] = [
  { value: CURRENCIES.ARS, label: CURRENCIES.ARS },
  { value: CURRENCIES.USD, label: CURRENCIES.USD },
]

const buildInitialState = (initialData?: Partial<TransactionFormData>): TransactionFormState => {
  const baseState: TransactionFormState = {
    type: TRANSACTION_TYPES.EXPENSE,
    date: formatDateToYYYYMMDD(new Date()),
    description: '',
    category_id: '',
    amount: 0,
    currency: CURRENCIES.ARS,
    expense_kind: '',
    from_currency: CURRENCIES.ARS,
    from_amount: 0,
    to_currency: CURRENCIES.USD,
    to_amount: 0,
  }

  if (!initialData) {
    return baseState
  }

  switch (initialData.type) {
    case TRANSACTION_TYPES.INCOME:
      return {
        ...baseState,
        type: initialData.type,
        date: initialData.date ?? baseState.date,
        description: initialData.description ?? '',
        category_id: initialData.category_id ?? '',
        amount: initialData.amount ?? 0,
        currency: initialData.currency ?? CURRENCIES.ARS,
      }
    case TRANSACTION_TYPES.EXPENSE:
      return {
        ...baseState,
        type: initialData.type,
        date: initialData.date ?? baseState.date,
        description: initialData.description ?? '',
        category_id: initialData.category_id ?? '',
        amount: initialData.amount ?? 0,
        currency: initialData.currency ?? CURRENCIES.ARS,
        expense_kind: initialData.expense_kind ?? '',
      }
    case TRANSACTION_TYPES.ADJUSTMENT:
      return {
        ...baseState,
        type: initialData.type,
        date: initialData.date ?? baseState.date,
        description: initialData.description ?? '',
        amount: initialData.amount ?? 0,
        currency: initialData.currency ?? CURRENCIES.ARS,
      }
    case TRANSACTION_TYPES.TRANSFER:
      return {
        ...baseState,
        type: initialData.type,
        date: initialData.date ?? baseState.date,
        description: initialData.description ?? '',
        from_currency: initialData.from_currency ?? CURRENCIES.ARS,
        from_amount: initialData.from_amount ?? 0,
        to_currency: initialData.to_currency ?? CURRENCIES.USD,
        to_amount: initialData.to_amount ?? 0,
      }
    default:
      return baseState
  }
}

export function TransactionForm({
  onSubmit,
  onCancel,
  loading = false,
  initialData,
  submitLabel,
  loadingLabel,
}: TransactionFormProps) {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const { t } = useTranslation()
  const { translateCategoryName } = useCategoryTranslation()
  const [formData, setFormData] = useState<TransactionFormState>(() => buildInitialState(initialData))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const expenseKindRequired =
    formData.type === TRANSACTION_TYPES.EXPENSE && formData.date >= EXPENSE_KIND_REQUIRED_FROM

  const filteredCategories = useMemo(() => {
    if (formData.type === TRANSACTION_TYPES.INCOME) {
      return categories.filter((category) => !category.expense_kind)
    }

    if (formData.type !== TRANSACTION_TYPES.EXPENSE) {
      return []
    }

    return categories.filter((category) => {
      if (!category.expense_kind) {
        return false
      }

      if (!formData.expense_kind) {
        return true
      }

      return category.expense_kind === formData.expense_kind
    })
  }, [categories, formData.type, formData.expense_kind])

  useEffect(() => {
    const loadCategories = async () => {
      if (!user) return

      try {
        const userCategories = await transactionService.getUserCategories(user.id)
        setCategories(userCategories)
      } catch (error) {
        console.error('Error loading categories:', error)
      }
    }

    loadCategories()
  }, [user])

  useEffect(() => {
    if (
      formData.type !== TRANSACTION_TYPES.INCOME &&
      formData.type !== TRANSACTION_TYPES.EXPENSE
    ) {
      if (formData.category_id) {
        setFormData((prev) => ({ ...prev, category_id: '' }))
      }
      return
    }

    if (filteredCategories.length === 0) {
      if (formData.category_id) {
        setFormData((prev) => ({ ...prev, category_id: '' }))
      }
      return
    }

    const categoryStillValid = filteredCategories.some((category) => category.id === formData.category_id)

    if (!categoryStillValid) {
      setFormData((prev) => ({ ...prev, category_id: filteredCategories[0]?.id ?? '' }))
    }
  }, [filteredCategories, formData.type, formData.category_id])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.date) {
      newErrors.date = t('form.validation.date.required')
    }

    if (formData.type === TRANSACTION_TYPES.INCOME || formData.type === TRANSACTION_TYPES.EXPENSE) {
      if (!formData.category_id) {
        newErrors.category_id = t('form.validation.category.required')
      }

      if (!formData.amount || formData.amount <= 0) {
        newErrors.amount = t('form.validation.amount.required')
      }

      if (formData.type === TRANSACTION_TYPES.EXPENSE && expenseKindRequired && !formData.expense_kind) {
        newErrors.expense_kind = t('form.validation.expenseKind.required')
      }
    }

    if (formData.type === TRANSACTION_TYPES.TRANSFER) {
      if (!formData.from_amount || formData.from_amount <= 0) {
        newErrors.from_amount = t('form.validation.amount.required')
      }

      if (!formData.to_amount || formData.to_amount <= 0) {
        newErrors.to_amount = t('form.validation.amount.required')
      }

      if (formData.from_currency === formData.to_currency) {
        newErrors.to_currency = t('form.validation.transferCurrencyDifferent')
      }
    }

    if (formData.type === TRANSACTION_TYPES.ADJUSTMENT && formData.amount === 0) {
      newErrors.amount = t('form.validation.adjustmentAmount.required')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    let payload: TransactionFormData

    switch (formData.type) {
      case TRANSACTION_TYPES.INCOME:
        payload = {
          type: TRANSACTION_TYPES.INCOME,
          date: formData.date,
          description: formData.description,
          category_id: formData.category_id,
          amount: formData.amount,
          currency: formData.currency,
        }
        break
      case TRANSACTION_TYPES.EXPENSE:
        payload = {
          type: TRANSACTION_TYPES.EXPENSE,
          date: formData.date,
          description: formData.description,
          category_id: formData.category_id,
          amount: formData.amount,
          currency: formData.currency,
          expense_kind: formData.expense_kind || undefined,
        }
        break
      case TRANSACTION_TYPES.TRANSFER:
        payload = {
          type: TRANSACTION_TYPES.TRANSFER,
          date: formData.date,
          description: formData.description,
          from_currency: formData.from_currency,
          from_amount: formData.from_amount,
          to_currency: formData.to_currency,
          to_amount: formData.to_amount,
        }
        break
      case TRANSACTION_TYPES.ADJUSTMENT:
        payload = {
          type: TRANSACTION_TYPES.ADJUSTMENT,
          date: formData.date,
          description: formData.description,
          amount: formData.amount,
          currency: formData.currency,
        }
        break
    }

    try {
      await onSubmit(payload)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const categoryOptions: SelectOption[] = filteredCategories.map((category) => ({
    value: category.id,
    label: translateCategoryName(category.name),
  }))

  const effectiveExchangeRate =
    formData.type === TRANSACTION_TYPES.TRANSFER && formData.to_amount > 0
      ? formData.from_amount / formData.to_amount
      : null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('form.transaction.type')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: TRANSACTION_TYPES.EXPENSE, label: t('form.transaction.expense') },
            { value: TRANSACTION_TYPES.INCOME, label: t('form.transaction.income') },
            { value: TRANSACTION_TYPES.TRANSFER, label: t('form.transaction.transfer') },
            { value: TRANSACTION_TYPES.ADJUSTMENT, label: t('form.transaction.adjustment') },
          ].map((option) => (
            <label key={option.value} className="flex items-center text-gray-700">
              <input
                type="radio"
                name="type"
                value={option.value}
                checked={formData.type === option.value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as TransactionType,
                    category_id: '',
                    expense_kind: '',
                  }))
                }
                className="mr-2"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <Input
        label={t('form.transaction.description')}
        type="text"
        value={formData.description}
        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
        placeholder={t('form.transaction.description.placeholder')}
      />

      <Input
        label={t('form.transaction.date')}
        type="date"
        value={formData.date}
        onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
        error={errors.date}
        required
      />

      {(formData.type === TRANSACTION_TYPES.INCOME ||
        formData.type === TRANSACTION_TYPES.EXPENSE ||
        formData.type === TRANSACTION_TYPES.ADJUSTMENT) && (
        <>
          <Select
            label={t('form.transaction.currency')}
            options={currencyOptions}
            value={formData.currency}
            onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value as CurrencyCode }))}
          />

          {formData.type === TRANSACTION_TYPES.EXPENSE && (
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
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expense_kind: e.target.value as 'fixed' | 'variable',
                      }))
                    }
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
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expense_kind: e.target.value as 'fixed' | 'variable',
                      }))
                    }
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

          {(formData.type === TRANSACTION_TYPES.INCOME || formData.type === TRANSACTION_TYPES.EXPENSE) && (
            <>
              <Select
                label={t('form.transaction.category')}
                options={categoryOptions}
                value={formData.category_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))}
                error={errors.category_id}
                placeholder={t('form.transaction.category.placeholder')}
                required
              />

              <Input
                label={t('form.transaction.amount')}
                type="number"
                step="0.01"
                min="0"
                value={formData.amount || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                }
                error={errors.amount}
                required
              />
            </>
          )}

          {formData.type === TRANSACTION_TYPES.ADJUSTMENT && (
            <Input
              label={t('form.transaction.amount')}
              type="number"
              step="0.01"
              value={formData.amount || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
              }
              error={errors.amount}
              helperText={t('form.transaction.adjustment.helper')}
              required
            />
          )}
        </>
      )}

      {formData.type === TRANSACTION_TYPES.TRANSFER && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label={t('form.transaction.transferFromCurrency')}
              options={currencyOptions}
              value={formData.from_currency}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, from_currency: e.target.value as CurrencyCode }))
              }
            />
            <Input
              label={t('form.transaction.transferFromAmount')}
              type="number"
              step="0.01"
              min="0"
              value={formData.from_amount || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, from_amount: parseFloat(e.target.value) || 0 }))
              }
              error={errors.from_amount}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label={t('form.transaction.transferToCurrency')}
              options={currencyOptions}
              value={formData.to_currency}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, to_currency: e.target.value as CurrencyCode }))
              }
              error={errors.to_currency}
            />
            <Input
              label={t('form.transaction.transferToAmount')}
              type="number"
              step="0.01"
              min="0"
              value={formData.to_amount || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, to_amount: parseFloat(e.target.value) || 0 }))
              }
              error={errors.to_amount}
              required
            />
          </div>

          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-sm font-medium text-gray-700">
              {t('form.transaction.effectiveExchangeRate')}
            </p>
            <p className="text-sm text-gray-600">
              {effectiveExchangeRate
                ? `${effectiveExchangeRate.toFixed(4)} ${formData.from_currency}/${formData.to_currency}`
                : t('form.transaction.exchangeRate.placeholder')}
            </p>
          </div>
        </>
      )}

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

export type { TransactionFormData } from '@/validations/transaction'
