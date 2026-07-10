'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select, type SelectOption } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { CURRENCIES } from '@/lib/constants'
import { formatDateToYYYYMMDD } from '@/lib/utils/date-utils'
import type { CommitmentFormData } from '@/validations/commitment'

interface CommitmentFormProps {
  onSubmit: (data: CommitmentFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const currencyOptions: SelectOption[] = [
  { value: CURRENCIES.ARS, label: CURRENCIES.ARS },
  { value: CURRENCIES.USD, label: CURRENCIES.USD },
]

const paymentMethodOptions: SelectOption[] = [
  { value: 'credit', label: 'Crédito (Tarjeta)' },
  { value: 'debit', label: 'Débito (Banco)' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
]

export default function CommitmentForm({
  onSubmit,
  onCancel,
  loading = false,
}: CommitmentFormProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<typeof CURRENCIES[keyof typeof CURRENCIES]>(CURRENCIES.ARS)
  const [date, setDate] = useState(formatDateToYYYYMMDD(new Date()))
  const [dueDate, setDueDate] = useState(formatDateToYYYYMMDD(new Date()))
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit' | 'cash' | 'transfer'>('credit')
  const [installmentsCount, setInstallmentsCount] = useState('1')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationErrors({})

    const parsedAmount = parseFloat(amount)
    const parsedInstallments = parseInt(installmentsCount, 10)

    const errors: Record<string, string> = {}
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.amount = 'El monto debe ser mayor a 0'
    }
    if (isNaN(parsedInstallments) || parsedInstallments < 1) {
      errors.installmentsCount = 'Debe registrar al menos 1 cuota'
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    try {
      const data: CommitmentFormData = {
        description,
        amount: parsedAmount,
        currency,
        date,
        due_date: dueDate,
        payment_method: paymentMethod,
        status: 'pending',
        installments_count: parsedInstallments,
      }
      await onSubmit(data)
    } catch (error) {
      console.error('Submit error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Ej: Compra de notebook"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Monto"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          error={validationErrors.amount}
          required
        />

        <Select
          label="Moneda"
          options={currencyOptions}
          value={currency}
          onChange={(e) => setCurrency(e.target.value as typeof CURRENCIES[keyof typeof CURRENCIES])}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Fecha de Compra"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <Input
          label="Fecha de Vencimiento / Pago"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Medio de Pago"
          options={paymentMethodOptions}
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as 'credit' | 'debit' | 'cash' | 'transfer')}
        />

        <Input
          label="Cantidad de Cuotas"
          type="number"
          min="1"
          step="1"
          value={installmentsCount}
          onChange={(e) => setInstallmentsCount(e.target.value)}
          error={validationErrors.installmentsCount}
          required
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Guardar Compromiso
        </Button>
      </div>
    </form>
  )
}
