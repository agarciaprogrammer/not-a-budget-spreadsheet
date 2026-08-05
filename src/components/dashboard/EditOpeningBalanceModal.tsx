'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'
import { formatCurrency } from '@/lib/utils/formatters'
import { transactionService } from '@/lib/services/transaction.service'
import { useAuth } from '@/components/providers/AuthProvider'

interface Props {
  isOpen: boolean
  onClose: () => void
  year: number
  month: number
  initialARS: number
  initialUSD: number
  onSaved: () => void
}

export default function EditOpeningBalanceModal({ isOpen, onClose, year, month, initialARS, initialUSD, onSaved }: Props) {
  const [realARS, setRealARS] = useState(String(initialARS ?? 0))
  const [realUSD, setRealUSD] = useState(String(initialUSD ?? 0))
  const [step, setStep] = useState<'input' | 'preview'>('input')
  const [saving, setSaving] = useState(false)
  const { t } = useTranslation()
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen) {
      setRealARS(String(initialARS ?? 0))
      setRealUSD(String(initialUSD ?? 0))
      setStep('input')
    }
  }, [isOpen, initialARS, initialUSD])

  const diffARS = (Number(realARS) || 0) - (initialARS || 0)
  const diffUSD = (Number(realUSD) || 0) - (initialUSD || 0)
  const hasDiff = Math.abs(diffARS) > 0.01 || Math.abs(diffUSD) > 0.01

  const handleProceedToPreview = () => {
    if (!hasDiff) {
      onClose()
      return
    }
    setStep('preview')
  }

  const handleConfirmSync = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      const today = new Date().toISOString().split('T')[0]

      // Create ARS adjustment if diff exists
      if (Math.abs(diffARS) > 0.01) {
        await transactionService.createTransaction(user.id, {
          type: 'adjustment',
          amount: Math.abs(diffARS),
          currency: 'ARS',
          date: today,
          description: `Sincronización de Saldo (${diffARS > 0 ? '+' : ''}${formatCurrency(diffARS, 'ARS')})`,
        })
      }

      // Create USD adjustment if diff exists
      if (Math.abs(diffUSD) > 0.01) {
        await transactionService.createTransaction(user.id, {
          type: 'adjustment',
          amount: Math.abs(diffUSD),
          currency: 'USD',
          date: today,
          description: `Sincronización de Saldo (${diffUSD > 0 ? '+' : ''}${formatCurrency(diffUSD, 'USD')})`,
        })
      }

      onSaved()
      onClose()
    } catch (error) {
      console.error('Failed to sync balance with adjustment transaction', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sincronizar Saldo">
      {step === 'input' ? (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Ingresá el saldo real de tus cuentas bancarias. Si existe una diferencia con el sistema, se generará una transacción de ajuste para conciliar el total sin alterar el historial.
          </p>

          <div className="bg-gray-50 p-3 rounded-lg space-y-2 border border-gray-100">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Saldo Actual en Sistema</div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ARS:</span>
              <span className="font-mono font-medium">{formatCurrency(initialARS, 'ARS')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">USD:</span>
              <span className="font-mono font-medium">{formatCurrency(initialUSD, 'USD')}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Saldo Real ARS (Santander + Brubank)</label>
            <Input type="number" value={realARS} onChange={(e) => setRealARS(e.target.value)} step="0.01" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Saldo Real USD (Santander + Brubank)</label>
            <Input type="number" value={realUSD} onChange={(e) => setRealUSD(e.target.value)} step="0.01" />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="ghost" onClick={onClose}>{t('cancel') || 'Cancelar'}</Button>
            <Button onClick={handleProceedToPreview} disabled={saving}>
              {hasDiff ? 'Ver Vista Previa' : 'Saldos Iguales'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Vista Previa de Transacción de Ajuste</h4>
            <p className="text-xs text-amber-700 leading-relaxed mb-3">
              Se registrará la siguiente transacción en tu libro mayor para sincronizar la diferencia:
            </p>
            <div className="space-y-1.5 text-xs font-mono bg-white p-2.5 rounded border border-amber-100">
              {Math.abs(diffARS) > 0.01 && (
                <div className="flex justify-between text-gray-800">
                  <span>Ajuste ARS:</span>
                  <span className={diffARS > 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                    {diffARS > 0 ? '+' : ''}{formatCurrency(diffARS, 'ARS')}
                  </span>
                </div>
              )}
              {Math.abs(diffUSD) > 0.01 && (
                <div className="flex justify-between text-gray-800">
                  <span>Ajuste USD:</span>
                  <span className={diffUSD > 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                    {diffUSD > 0 ? '+' : ''}{formatCurrency(diffUSD, 'USD')}
                  </span>
                </div>
              )}
              <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-1 mt-1">
                Tipo: ADJUSTMENT | Fecha: Hoy
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="ghost" onClick={() => setStep('input')}>Volver</Button>
            <Button onClick={handleConfirmSync} disabled={saving}>
              {saving ? 'Guardando Ajuste...' : 'Confirmar y Sincronizar'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
