'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { commitmentService, type InstallmentWithCommitment } from '@/lib/services/commitment.service'
import { LoadingState } from '@/components/ui/LoadingState'
import { formatCurrency } from '@/lib/utils/formatters'

interface InstallmentsCalendarProps {
  refreshTrigger: number
  onRefresh?: () => void
}

interface GroupedInstallments {
  monthLabel: string
  monthKey: string // YYYY-MM
  installments: InstallmentWithCommitment[]
  totals: {
    ARS: number
    USD: number
  }
}

export default function InstallmentsCalendar({ refreshTrigger }: InstallmentsCalendarProps) {
  const { user } = useAuth()
  const [installments, setInstallments] = useState<InstallmentWithCommitment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadInstallments = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const result = await commitmentService.getUserInstallments(user.id)
      setInstallments(result)
    } catch (err) {
      console.error('Error loading installments:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar cuotas')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadInstallments()
    }
  }, [user, refreshTrigger, loadInstallments])

  // Agrupar cuotas por mes y año de vencimiento
  const getGroupedData = (): GroupedInstallments[] => {
    const groups: Record<string, { monthLabel: string; installments: InstallmentWithCommitment[] }> = {}

    installments.forEach((inst) => {
      const [year, month] = inst.due_date.split('-')
      const monthKey = `${year}-${month}`
      
      if (!groups[monthKey]) {
        const date = new Date(Number(year), Number(month) - 1, 1)
        const monthLabel = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        groups[monthKey] = {
          monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          installments: [],
        }
      }
      
      groups[monthKey].installments.push(inst)
    })

    return Object.keys(groups)
      .sort()
      .map((monthKey) => {
        const group = groups[monthKey]
        const totals = { ARS: 0, USD: 0 }

        group.installments.forEach((inst) => {
          const currency = inst.commitments?.currency || 'ARS'
          // Sumar al total mensual únicamente si la cuota no está pagada (completed)
          if (inst.status !== 'completed') {
            totals[currency] += inst.amount
          }
        })

        return {
          monthKey,
          monthLabel: group.monthLabel,
          installments: group.installments,
          totals,
        }
      })
  }

  if (loading && installments.length === 0) {
    return <LoadingState message="Cargando proyección de cuotas..." />
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
        {error}
      </div>
    )
  }

  const groupedData = getGroupedData()

  if (groupedData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay cuotas programadas para los próximos meses.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupedData.map((group) => (
          <div key={group.monthKey} className="bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden">
            {/* Header del mes */}
            <div className="bg-gray-50 border-b px-4 py-3 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 text-sm">{group.monthLabel}</h3>
              <div className="text-right text-[10px] space-y-0.5">
                <span className="text-gray-500 block mb-0.5">Pendiente de pago:</span>
                {group.totals.ARS > 0 && (
                  <div className="font-semibold text-amber-600">
                    {formatCurrency(group.totals.ARS, 'ARS')}
                  </div>
                )}
                {group.totals.USD > 0 && (
                  <div className="font-semibold text-amber-600">
                    {formatCurrency(group.totals.USD, 'USD')}
                  </div>
                )}
                {group.totals.ARS === 0 && group.totals.USD === 0 && (
                  <span className="text-green-600 font-semibold">Al día 🎉</span>
                )}
              </div>
            </div>

            {/* Listado de cuotas */}
            <div className="p-4 flex-1 divide-y divide-gray-100 overflow-y-auto max-h-60">
              {group.installments.map((inst) => (
                <div key={inst.id} className="py-2.5 flex justify-between items-start text-xs first:pt-0 last:pb-0">
                  <div className="space-y-1 pr-2">
                    <p className="font-medium text-gray-900 leading-tight">
                      {inst.commitments?.description || 'Compromiso'}
                    </p>
                    <p className="text-gray-500 text-[10px]">
                      Cuota {inst.installment_number} de {inst.total_installments} • {inst.commitments?.payment_method === 'credit' ? 'Tarjeta' : 'Otro'}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(inst.amount, inst.commitments?.currency || 'ARS')}
                    </p>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-1.5 py-0.5 inline-flex text-[9px] leading-3 font-semibold rounded-full ${
                        inst.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inst.status === 'completed' ? 'Pagada' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

