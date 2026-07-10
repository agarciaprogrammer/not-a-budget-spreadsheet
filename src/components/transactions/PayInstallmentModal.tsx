'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { formatDateToYYYYMMDD } from '@/lib/utils/date-utils'
import { commitmentService, type InstallmentWithCommitment } from '@/lib/services/commitment.service'
import { useAuth } from '@/components/providers/AuthProvider'

interface PayInstallmentModalProps {
  isOpen: boolean
  onClose: () => void
  installment: InstallmentWithCommitment | null
  onPaymentRegistered: () => void
}

export default function PayInstallmentModal({
  isOpen,
  onClose,
  installment,
  onPaymentRegistered,
}: PayInstallmentModalProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(formatDateToYYYYMMDD(new Date()))
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Actualizar el estado mediante useEffect cuando se abre el modal o cambia la cuota seleccionada
  useEffect(() => {
    if (isOpen && installment) {
      setAmount(installment.amount.toString())
      setDescription(`Pago cuota ${installment.installment_number}/${installment.total_installments} - ${installment.commitments?.description || 'Compromiso'}`)
      setDate(formatDateToYYYYMMDD(new Date()))
      setError(null)
    }
  }, [isOpen, installment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !installment) return

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await commitmentService.registerPayment(user.id, {
        amount: parsedAmount,
        currency: installment.commitments?.currency || 'ARS',
        date,
        description: description || undefined,
        installmentIds: [installment.id],
      })
      onPaymentRegistered()
      onClose()
    } catch (err) {
      console.error('Error registering payment:', err)
      setError(err instanceof Error ? err.message : 'Error al registrar el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Pago de Cuota"
      size="sm"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg border text-xs space-y-1 mb-2">
          <p className="text-gray-500">Compromiso original:</p>
          <p className="font-semibold text-gray-900">{installment?.commitments?.description || 'Sin descripción'}</p>
          <p className="text-gray-700">Monto total de la cuota: <span className="font-semibold">{installment?.amount} {installment?.commitments?.currency}</span></p>
        </div>

        <Input
          label="Monto a Pagar"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <Input
          label="Fecha de Pago"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <Input
          label="Detalle del Pago"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej: Pago total de la cuota con tarjeta"
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Confirmar Pago
          </Button>
        </div>
      </form>
    </Modal>
  )
}
