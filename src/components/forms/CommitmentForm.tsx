'use client'

import { useState, useEffect, useMemo } from 'react'
import { CURRENCIES, EXPENSE_KINDS } from '@/lib/constants'
import { formatDateToYYYYMMDD } from '@/lib/utils/date-utils'
import { formatCurrency } from '@/lib/utils/formatters'
import { transactionService, type Category } from '@/lib/services/transaction.service'
import { useCategoryTranslation } from '@/hooks/useCategoryTranslation'
import { useAuth } from '@/components/providers/AuthProvider'
import type { CommitmentFormData } from '@/validations/commitment'

interface CommitmentFormProps {
  onSubmit: (data: CommitmentFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export default function CommitmentForm({
  onSubmit,
  onCancel,
  loading = false,
}: CommitmentFormProps) {
  const { user } = useAuth()
  const { translateCategoryName } = useCategoryTranslation()
  const [categories, setCategories] = useState<Category[]>([])

  // Pasos: 0 (Detalles de compra), 1 (Monto y Moneda), 2 (Cuotas), 3 (Vencimiento), 4 (Resumen & Confirmar)
  const [step, setStep] = useState(0)

  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [expenseKind, setExpenseKind] = useState<'variable' | 'fixed'>('variable')
  const [cardLabel, setCardLabel] = useState('Santander Crédito')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'ARS' | 'USD'>(CURRENCIES.ARS)
  const [date, setDate] = useState(formatDateToYYYYMMDD(new Date()))
  const [dueDate, setDueDate] = useState(formatDateToYYYYMMDD(new Date()))
  const [installmentsCount, setInstallmentsCount] = useState('1')
  const [customInstallments, setCustomInstallments] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCats() {
      if (!user) return
      try {
        const userCategories = await transactionService.getUserCategories(user.id)
        setCategories(userCategories.filter(c => !!c.expense_kind))
      } catch (err) {
        console.error('Error loading categories:', err)
      }
    }
    loadCats()
  }, [user])

  const filteredCategories = useMemo(() => {
    return categories.filter(c => !expenseKind || c.expense_kind === expenseKind)
  }, [categories, expenseKind])

  const handleNext = () => {
    setValidationError(null)
    if (step === 0) {
      if (!description.trim()) {
        setValidationError('Por favor ingresá la descripción de la compra.')
        return
      }
      setStep(1)
    } else if (step === 1) {
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setValidationError('Por favor ingresá un monto válido mayor a 0.')
        return
      }
      setStep(2)
    } else if (step === 2) {
      const parsedInst = parseInt(installmentsCount, 10)
      if (isNaN(parsedInst) || parsedInst < 1) {
        setValidationError('Por favor ingresá una cantidad válida de cuotas.')
        return
      }
      setStep(3)
    } else if (step === 3) {
      if (!dueDate) {
        setValidationError('Por favor ingresá la fecha del primer vencimiento.')
        return
      }
      setStep(4)
    }
  }

  const handleBack = () => {
    setValidationError(null)
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleQuickInstallment = (val: number) => {
    setInstallmentsCount(val.toString())
    setCustomInstallments(false)
    setStep(3)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const parsedAmount = parseFloat(amount)
    const parsedInstallments = parseInt(installmentsCount, 10)

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError('El monto debe ser mayor a 0.')
      return
    }
    if (isNaN(parsedInstallments) || parsedInstallments < 1) {
      setValidationError('Debe registrar al menos 1 cuota.')
      return
    }

    try {
      const data: CommitmentFormData = {
        description,
        amount: parsedAmount,
        currency,
        date,
        due_date: dueDate,
        payment_method: 'credit',
        status: 'pending',
        installments_count: parsedInstallments,
        category_id: categoryId || undefined,
        expense_kind: expenseKind,
        card_label: cardLabel || 'Santander Crédito'
      }
      await onSubmit(data)
    } catch (error) {
      console.error('Submit error:', error)
      setValidationError('Ocurrió un error al guardar la compra a crédito.')
    }
  }

  const selectedCategoryObj = categories.find(c => c.id === categoryId)

  return (
    <div style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Indicador de pasos */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 2,
              background: i === step ? 'var(--casio-blue)' : i < step ? 'var(--text-secondary)' : 'var(--border-subtle)',
              borderRadius: 1,
              transition: 'background 200ms ease'
            }}
          />
        ))}
      </div>

      {validationError && (
        <p style={{ fontSize: 12, color: 'var(--red-alert)', margin: 0, fontFamily: 'var(--font-mono)' }}>
          {validationError}
        </p>
      )}

      {/* PASO 0: Detalle de la compra a crédito */}
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
            Paso 1: Detalle de la Compra a Crédito
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase' }}>
              Descripción
            </label>
            <input
              type="text"
              autoFocus
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Supermercado, Compra Notebook..."
              style={{
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-mono)',
                fontSize: 15,
                color: 'var(--text-primary)',
                padding: '6px 0',
                outline: 'none',
                width: '100%'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Tipo de Gasto */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase' }}>
                Tipo de Gasto
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { value: EXPENSE_KINDS.VARIABLE, label: 'Variable' },
                  { value: EXPENSE_KINDS.FIXED, label: 'Fijo' },
                ].map((k) => (
                  <button
                    key={k.value}
                    type="button"
                    onClick={() => setExpenseKind(k.value as 'variable' | 'fixed')}
                    style={{
                      flex: 1,
                      background: expenseKind === k.value ? 'var(--bg-raised)' : 'none',
                      border: '1px solid var(--border-subtle)',
                      padding: '6px 0',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: expenseKind === k.value ? 'var(--text-primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      borderRadius: 2
                    }}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tarjeta Emisora */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase' }}>
                Tarjeta / Origen
              </label>
              <select
                value={cardLabel}
                onChange={(e) => setCardLabel(e.target.value)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  padding: '6px 0',
                  outline: 'none'
                }}
              >
                <option value="Santander Crédito" style={{ background: 'var(--bg-surface)' }}>Santander Crédito</option>
                <option value="Galicia Visa" style={{ background: 'var(--bg-surface)' }}>Galicia Visa</option>
                <option value="BBVA Mastercard" style={{ background: 'var(--bg-surface)' }}>BBVA Mastercard</option>
                <option value="Otra Tarjeta" style={{ background: 'var(--bg-surface)' }}>Otra Tarjeta</option>
              </select>
            </div>
          </div>

          {/* Categoría */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase' }}>
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                color: 'var(--text-primary)',
                padding: '6px 0',
                outline: 'none'
              }}
            >
              <option value="" style={{ background: 'var(--bg-surface)' }}>Sin categoría</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id} style={{ background: 'var(--bg-surface)' }}>
                  {translateCategoryName(c.name)}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha de Compra */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase' }}>
              Fecha de Compra
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                color: 'var(--text-primary)',
                padding: '6px 0',
                outline: 'none'
              }}
            />
          </div>
        </div>
      )}

      {/* PASO 1: ¿Cuánto salió? */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
            Paso 2: ¿Cuánto salió el total?
          </h3>
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            {(['ARS', 'USD'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                style={{
                  background: currency === c ? 'var(--bg-raised)' : 'none',
                  border: '1px solid var(--border-subtle)',
                  padding: '8px 16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  color: currency === c ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  borderRadius: 2
                }}
              >
                {c}
              </button>
            ))}
          </div>

          <input
            type="number"
            step="0.01"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            style={{
              background: 'none',
              border: 'none',
              borderBottom: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--text-primary)',
              padding: '8px 0',
              outline: 'none',
              width: '100%'
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNext() }}
          />
        </div>
      )}

      {/* PASO 2: ¿En cuántas cuotas? */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
            Paso 3: ¿En cuántas cuotas?
          </h3>
          
          {!customInstallments ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[1, 3, 6, 9, 12].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickInstallment(val)}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 2,
                    padding: '12px 0',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'border-color 150ms ease, background 150ms ease'
                  }}
                  className="installment-btn"
                >
                  {val} {val === 1 ? 'cuota' : 'cuotas'}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomInstallments(true)}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 2,
                  padding: '12px 0',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Otro...
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="number"
                min="1"
                step="1"
                autoFocus
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(e.target.value)}
                placeholder="Cantidad de cuotas"
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 16,
                  color: 'var(--text-primary)',
                  padding: '8px 0',
                  outline: 'none'
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleNext() }}
              />
              <button
                type="button"
                onClick={() => setCustomInstallments(false)}
                style={{
                  alignSelf: 'flex-start',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                volver a opciones rápidas
              </button>
            </div>
          )}
        </div>
      )}

      {/* PASO 3: ¿Cuándo vence la primera? */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
            Paso 4: ¿Cuándo vence la primera cuota?
          </h3>
          <input
            type="date"
            autoFocus
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              color: 'var(--text-primary)',
              padding: '8px 0',
              outline: 'none',
              width: '100%'
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNext() }}
          />
        </div>
      )}

      {/* PASO 4: Resumen & Confirmar */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3 style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
            Paso 5: Confirmar Compra a Crédito
          </h3>
          
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 2, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Detalle</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{description}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Tarjeta / Origen</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{cardLabel}</span>
              </div>
              <div>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Categoría</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {selectedCategoryObj ? translateCategoryName(selectedCategoryObj.name) : 'Sin categoría'}
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Monto total</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(parseFloat(amount) || 0, currency)}
              </span>
            </div>

            <div>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Plan de cuotas</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {installmentsCount} {parseInt(installmentsCount, 10) === 1 ? 'cuota' : 'cuotas consecutivas'} ({formatCurrency((parseFloat(amount) || 0) / (parseInt(installmentsCount, 10) || 1), currency)} c/u)
              </span>
            </div>

            <div>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Primer Vencimiento</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{dueDate}</span>
            </div>
          </div>
        </div>
      )}

      {/* Botones de navegación */}
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        {step > 0 && (
          <button
            type="button"
            onClick={handleBack}
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
            Atrás
          </button>
        )}
        
        {step === 0 && (
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
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={handleNext}
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
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
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
        )}
      </div>

      <style>{`
        .installment-btn:hover {
          border-color: var(--border-default) !important;
          background: var(--bg-surface) !important;
        }
      `}</style>
    </div>
  )
}
