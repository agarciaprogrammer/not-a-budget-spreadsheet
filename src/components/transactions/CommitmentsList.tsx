'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { commitmentService, type Commitment } from '@/lib/services/commitment.service'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'

interface CommitmentsListProps {
  refreshTrigger: number
  onRefresh?: () => void
}

const getPaymentMethodLabel = (method: Commitment['payment_method']) => {
  switch (method) {
    case 'credit':
      return 'Crédito (Tarjeta)'
    case 'debit':
      return 'Débito'
    case 'cash':
      return 'Efectivo'
    case 'transfer':
      return 'Transferencia'
  }
}

const getStatusBadgeStyles = (status: Commitment['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800'
    case 'partial':
      return 'bg-blue-100 text-blue-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
  }
}

export default function CommitmentsList({ refreshTrigger, onRefresh }: CommitmentsListProps) {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCommitments = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const result = await commitmentService.getUserCommitments(user.id, {
        page,
        pageSize,
      })
      setCommitments(result.data)
      setTotal(result.total)
    } catch (err) {
      console.error('Error loading commitments:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar compromisos')
    } finally {
      setLoading(false)
    }
  }, [user, page, pageSize])

  useEffect(() => {
    if (user) {
      loadCommitments()
    }
  }, [user, refreshTrigger, loadCommitments])

  const handleDelete = async (commitmentId: string) => {
    if (!user || !confirm('¿Estás seguro de que deseas eliminar este compromiso?')) {
      return
    }

    try {
      await commitmentService.deleteCommitment(commitmentId, user.id)
      loadCommitments()
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Error deleting commitment:', err)
      alert(err instanceof Error ? err.message : 'Error al eliminar el compromiso')
    }
  }

  if (loading && commitments.length === 0) {
    return <LoadingState message="Cargando compromisos..." />
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
        {error}
      </div>
    )
  }

  if (commitments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No tienes compromisos registrados.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Compra</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {commitments.map((commitment) => (
              <tr key={commitment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(commitment.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {commitment.description || 'Sin descripción'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(commitment.amount, commitment.currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(commitment.due_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getPaymentMethodLabel(commitment.payment_method)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeStyles(commitment.status)}`}>
                    {commitment.status === 'pending' && 'Pendiente'}
                    {commitment.status === 'partial' && 'Parcial'}
                    {commitment.status === 'completed' && 'Completado'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {commitment.status === 'pending' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(commitment.id)}
                    >
                      Eliminar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > pageSize && (
        <div className="flex justify-center pt-4">
          <Pagination
            currentPage={page}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  )
}
