'use client'

import { useState, useEffect, useMemo } from 'react'
import { transactionService, type Category, type CurrencyCode, type TransactionType } from '@/lib/services/transaction.service'
import { useAuth } from '@/components/providers/AuthProvider'
import { commitmentService, type InstallmentWithCommitment } from '@/lib/services/commitment.service'
import { formatDateToYYYYMMDD } from '@/lib/utils/date-utils'
import { useTranslation } from '@/hooks/useTranslation'
import { useCategoryTranslation } from '@/hooks/useCategoryTranslation'
import { CURRENCIES, EXPENSE_KIND_REQUIRED_FROM, EXPENSE_KINDS, TRANSACTION_TYPES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils/formatters'
import type { TransactionFormData } from '@/validations/transaction'

interface TransactionFormState {
  type: TransactionType | ''
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

const currencyOptions = [CURRENCIES.ARS, CURRENCIES.USD]

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
  const [step, setStep] = useState<number>(initialData?.type ? 1 : 0) // 0: Selección de intención, 1: Formulario
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingInstallments, setPendingInstallments] = useState<InstallmentWithCommitment[]>([])
  const [selectedInstallmentIds, setSelectedInstallmentIds] = useState<string[]>([])

  const [formData, setFormData] = useState<TransactionFormState>(() => {
    const init = (initialData ?? {}) as any
    const base = {
      type: (init.type ?? '') as TransactionType | '',
      date: init.date ?? formatDateToYYYYMMDD(new Date()),
      description: init.description ?? '',
      category_id: init.category_id ?? '',
      amount: init.amount ?? 0,
      currency: init.currency ?? CURRENCIES.ARS,
      expense_kind: init.expense_kind ?? '',
      from_currency: init.from_currency ?? CURRENCIES.ARS,
      from_amount: init.from_amount ?? 0,
      to_currency: init.to_currency ?? CURRENCIES.USD,
      to_amount: init.to_amount ?? 0,
    }
    return base
  })


  useEffect(() => {
    async function fetchPending() {
      if (user && formData.type === TRANSACTION_TYPES.EXPENSE) {
        try {
          const insts = await commitmentService.getUserInstallments(user.id, { status: 'pending' })
          setPendingInstallments(insts)
        } catch (err) {
          console.error('Error fetching pending installments:', err)
        }
      }
    }
    fetchPending()
  }, [user, formData.type])

  const handleInstallmentToggle = (id: string, checked: boolean) => {
    setSelectedInstallmentIds((prev) => {
      const next = checked ? [...prev, id] : prev.filter((i) => i !== id)
      const totalAmount = pendingInstallments
        .filter((inst) => next.includes(inst.id))
        .reduce((sum, inst) => sum + inst.amount, 0)
      if (totalAmount > 0) {
        setFormData((f) => ({ ...f, amount: totalAmount }))
      }
      return next
    })
  }

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
      if (!category.expense_kind) return false
      if (!formData.expense_kind) return true
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

  const handleFormSubmit = async (e: React.FormEvent) => {
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
          installment_ids: selectedInstallmentIds.length > 0 ? selectedInstallmentIds : undefined,
        } as Extract<TransactionFormData, { type: 'expense' }>
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
      default:
        return
    }

    try {
      await onSubmit(payload)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const effectiveExchangeRate =
    formData.type === TRANSACTION_TYPES.TRANSFER && formData.to_amount > 0
      ? formData.from_amount / formData.to_amount
      : null

  // Paso 0: Selección de Intención
  if (step === 0) {
    return (
      <div style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h3 style={{
            fontSize: 14,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: '0 0 16px'
          }}>
            ¿Qué querés registrar?
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { value: TRANSACTION_TYPES.EXPENSE, label: 'Gasto' },
              { value: TRANSACTION_TYPES.INCOME, label: 'Ingreso' },
              { value: TRANSACTION_TYPES.TRANSFER, label: 'Transferencia' },
              { value: TRANSACTION_TYPES.ADJUSTMENT, label: 'Ajuste' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setFormData(f => ({ ...f, type: option.value as TransactionType }))
                  setStep(1)
                }}
                className="modal-intent-btn"
                style={{
                  background: 'none',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 2,
                  padding: '14px 20px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'border-color 150ms ease, background 150ms ease'
                }}
              >
                <span style={{ color: 'var(--text-disabled)' }}>●</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            type="button"
            onClick={onCancel}
            className="c-btn-minimal"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textAlign: 'center',
              padding: '10px 0'
            }}
          >
            Cancelar
          </button>
        </div>
        <style>{`
          .modal-intent-btn:hover {
            border-color: var(--border-default) !important;
            background: var(--bg-surface) !important;
          }
        `}</style>
      </div>
    )
  }

  // Paso 1: Formulario Correspondiente
  return (
    <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '8px 4px' }}>
      
      {/* Intención actual con botón para volver atrás */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-disabled)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
        }}>
          Tipo: <span style={{ color: 'var(--text-primary)' }}>{formData.type.toUpperCase()}</span>
        </span>
        {!initialData?.type && (
          <button
            type="button"
            onClick={() => setStep(0)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0
            }}
          >
            cambiar
          </button>
        )}
      </div>

      {/* Descripción */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase' }}>
          Descripción
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Escribí una descripción..."
          style={{
            background: 'none',
            border: 'none',
            borderBottom: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            color: 'var(--text-primary)',
            padding: '6px 0',
            outline: 'none'
          }}
        />
      </div>

      {/* Fecha */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase' }}>
          Fecha
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            color: 'var(--text-primary)',
            padding: '6px 0',
            outline: 'none'
          }}
        />
        {errors.date && <p style={{ fontSize: 11, color: 'var(--red-alert)', margin: 0 }}>{errors.date}</p>}
      </div>

      {/* Inputs específicos para Gasto / Ingreso / Ajuste */}
      {(formData.type === TRANSACTION_TYPES.EXPENSE ||
        formData.type === TRANSACTION_TYPES.INCOME ||
        formData.type === TRANSACTION_TYPES.ADJUSTMENT) && (
        <>
          {/* Moneda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase' }}>
              Moneda
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              {currencyOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, currency: c as CurrencyCode }))}
                  style={{
                    background: formData.currency === c ? 'var(--bg-raised)' : 'none',
                    border: '1px solid var(--border-subtle)',
                    padding: '8px 16px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    color: formData.currency === c ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    borderRadius: 2
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de Gasto (Fijo / Variable) */}
          {formData.type === TRANSACTION_TYPES.EXPENSE && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase' }}>
                Tipo de Gasto
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { value: EXPENSE_KINDS.FIXED, label: 'Fijo' },
                  { value: EXPENSE_KINDS.VARIABLE, label: 'Variable' },
                ].map((k) => (
                  <button
                    key={k.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, expense_kind: k.value as 'fixed' | 'variable' }))}
                    style={{
                      background: formData.expense_kind === k.value ? 'var(--bg-raised)' : 'none',
                      border: '1px solid var(--border-subtle)',
                      padding: '8px 16px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      color: formData.expense_kind === k.value ? 'var(--text-primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      borderRadius: 2
                    }}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
              {errors.expense_kind && <p style={{ fontSize: 11, color: 'var(--red-alert)', margin: 0 }}>{errors.expense_kind}</p>}
            </div>
          )}

          {/* Categoría */}
          {(formData.type === TRANSACTION_TYPES.INCOME || formData.type === TRANSACTION_TYPES.EXPENSE) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase' }}>
                Categoría
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  padding: '6px 0',
                  outline: 'none',
                  borderRadius: 0,
                  WebkitAppearance: 'none'
                }}
              >
                <option value="" disabled style={{ background: 'var(--bg-surface)' }}>Seleccionar categoría...</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id} style={{ background: 'var(--bg-surface)' }}>
                    {translateCategoryName(c.name)}
                  </option>
                ))}
              </select>
              {errors.category_id && <p style={{ fontSize: 11, color: 'var(--red-alert)', margin: 0 }}>{errors.category_id}</p>}
            </div>
          )}

          {/* Cuotas Pendientes Asociables (Gasto únicamente) */}
          {formData.type === TRANSACTION_TYPES.EXPENSE && pendingInstallments.length > 0 && (
            <div style={{ border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Asociar a Cuotas Pendientes (opcional)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 110, overflowY: 'auto' }}>
                {pendingInstallments.map((inst) => (
                  <label key={inst.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={selectedInstallmentIds.includes(inst.id)}
                      onChange={(e) => handleInstallmentToggle(inst.id, e.target.checked)}
                      style={{ accentColor: 'var(--casio-blue)' }}
                    />
                    <span>
                      {inst.commitments?.description} ({inst.installment_number}/{inst.total_installments}) — {formatCurrency(inst.amount, inst.commitments?.currency as 'ARS' | 'USD')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Monto */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase' }}>
              Monto
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
              style={{
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-mono)',
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-primary)',
                padding: '6px 0',
                outline: 'none'
              }}
            />
            {errors.amount && <p style={{ fontSize: 11, color: 'var(--red-alert)', margin: 0 }}>{errors.amount}</p>}
          </div>
        </>
      )}

      {/* Inputs específicos para Transferencia */}
      {formData.type === TRANSACTION_TYPES.TRANSFER && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Origen */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Desde</label>
                <select
                  value={formData.from_currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, from_currency: e.target.value as CurrencyCode }))}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: 6, width: '100%' }}
                >
                  {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Monto Origen</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.from_amount || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, from_amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid var(--border-subtle)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    padding: '6px 0',
                    outline: 'none',
                    width: '100%'
                  }}
                />
              </div>
            </div>
            {errors.from_amount && <p style={{ fontSize: 11, color: 'var(--red-alert)', margin: 0 }}>{errors.from_amount}</p>}

            {/* Destino */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Hacia</label>
                <select
                  value={formData.to_currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, to_currency: e.target.value as CurrencyCode }))}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: 6, width: '100%' }}
                >
                  {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Monto Destino</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.to_amount || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, to_amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid var(--border-subtle)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    padding: '6px 0',
                    outline: 'none',
                    width: '100%'
                  }}
                />
              </div>
            </div>
            {errors.to_amount && <p style={{ fontSize: 11, color: 'var(--red-alert)', margin: 0 }}>{errors.to_amount}</p>}
            {errors.to_currency && <p style={{ fontSize: 11, color: 'var(--red-alert)', margin: 0 }}>{errors.to_currency}</p>}

            {/* Tipo de Cambio Implícito */}
            {effectiveExchangeRate && (
              <div style={{ padding: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 2 }}>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Tipo de cambio implícito</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  1 USD = {effectiveExchangeRate.toFixed(2)} ARS
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Botones de acción */}
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            background: 'none',
            border: '1px solid var(--border-subtle)',
            borderRadius: 2,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '12px 0',
            textAlign: 'center'
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            flex: 1,
            background: 'var(--bg-raised)',
            border: '1px solid var(--border-default)',
            borderRadius: 2,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-primary)',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '12px 0',
            textAlign: 'center',
            fontWeight: 600
          }}
        >
          {loading ? 'Guardando...' : 'Confirmar'}
        </button>
      </div>
    </form>
  )
}

export type { TransactionFormData } from '@/validations/transaction'
