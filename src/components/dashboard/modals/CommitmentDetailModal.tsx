'use client'

import { useState, useEffect } from 'react'
import CasioModal from './CasioModal'
import { commitmentService, type Commitment, type Installment } from '@/lib/services/commitment.service'
import { transactionService } from '@/lib/services/transaction.service'
import { useAuth } from '@/components/providers/AuthProvider'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { useCategoryTranslation } from '@/hooks/useCategoryTranslation'

interface CommitmentDetailModalProps {
  commitmentId: string | null
  isOpen: boolean
  onClose: () => void
  onDeleted?: () => void
}

export default function CommitmentDetailModal({
  commitmentId,
  isOpen,
  onClose,
  onDeleted,
}: CommitmentDetailModalProps) {
  const { user } = useAuth()
  const { translateCategoryName } = useCategoryTranslation()

  const [loading, setLoading] = useState(true)
  const [commitment, setCommitment] = useState<Commitment | null>(null)
  const [installments, setInstallments] = useState<Installment[]>([])
  const [categoryName, setCategoryName] = useState<string>('')

  useEffect(() => {
    async function loadDetails() {
      if (!commitmentId || !isOpen || !user) return
      setLoading(true)
      try {
        const data = await commitmentService.getCommitmentDetails(commitmentId)
        setCommitment(data.commitment)
        setInstallments(data.installments)

        if (data.commitment.category_id) {
          const cats = await transactionService.getUserCategories(user.id)
          const cat = cats.find((c) => c.id === data.commitment.category_id)
          if (cat) {
            setCategoryName(cat.name)
          }
        }
      } catch (err) {
        console.error('Error loading commitment details:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDetails()
  }, [commitmentId, isOpen, user])

  const handleDelete = async () => {
    if (!user || !commitmentId || !confirm('¿Eliminar este compromiso y todas sus cuotas?')) return
    try {
      await commitmentService.deleteCommitment(commitmentId, user.id)
      if (onDeleted) onDeleted()
      onClose()
    } catch (err) {
      console.error('Error deleting commitment:', err)
    }
  }

  if (!isOpen) return null

  const paidInsts = installments.filter(i => i.status === 'completed')
  const paidCount = paidInsts.length
  const totalInsts = installments.length || 1
  const paidAmount = paidInsts.reduce((sum, i) => sum + i.amount, 0)
  const remainingAmount = commitment ? Math.max(0, commitment.amount - paidAmount) : 0
  const progressPct = (paidCount / totalInsts) * 100

  return (
    <CasioModal
      isOpen={isOpen}
      onClose={onClose}
      title={commitment?.description || 'Detalle del Compromiso'}
      size="md"
    >
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 0' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 40, background: 'var(--border-subtle)', borderRadius: 3, opacity: 0.5 - i * 0.1 }} />
          ))}
        </div>
      ) : commitment ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header Summary Box */}
          <div style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: 4,
            padding: 16,
            background: 'rgba(255, 255, 255, 0.015)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                  Fecha de Compra
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {formatDate(commitment.date)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                  Tarjeta / Origen
                </span>
                <span style={{ fontSize: 13, color: 'var(--casio-blue)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {commitment.card_label || 'Santander Crédito'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                  Categoría
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {categoryName ? translateCategoryName(categoryName) : 'General'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                  Tipo de Gasto
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', textTransform: 'capitalize' }}>
                  {commitment.expense_kind || 'Variable'}
                </span>
              </div>
            </div>

            {/* Financial Totals */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
              <div>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                  Monto Total Obligado
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {formatCurrency(commitment.amount, commitment.currency)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                  Pagado
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--green-lcd)', fontFamily: 'var(--font-mono)' }}>
                  {formatCurrency(paidAmount, commitment.currency)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                  Pendiente Restante
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--yellow-warn)', fontFamily: 'var(--font-mono)' }}>
                  {formatCurrency(remainingAmount, commitment.currency)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginTop: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>Plan de Cuotas: {paidCount} de {totalInsts} pagadas</span>
                <span>{progressPct.toFixed(0)}%</span>
              </div>
              <div className="c-progress-track" style={{ height: 5 }}>
                <div
                  className="c-progress-fill"
                  style={{
                    width: `${Math.max(progressPct, commitment.status === 'completed' ? 100 : 5)}%`,
                    background: commitment.status === 'completed' ? 'var(--green-lcd)' : 'var(--casio-blue)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Schedule of Installments */}
          <div>
            <div className="c-label" style={{ marginBottom: 10, fontSize: 10, letterSpacing: '0.08em' }}>
              CALENDARIO DE CUOTAS
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '90px 1fr 90px 80px',
                gap: 8,
                paddingBottom: 6,
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <div className="c-label" style={{ fontSize: 8 }}>CUOTA</div>
                <div className="c-label" style={{ fontSize: 8 }}>MONTO</div>
                <div className="c-label" style={{ fontSize: 8 }}>VENCIMIENTO</div>
                <div className="c-label" style={{ fontSize: 8, textAlign: 'right' }}>ESTADO</div>
              </div>

              {installments.map((inst) => {
                const isPaid = inst.status === 'completed'
                return (
                  <div
                    key={inst.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '90px 1fr 90px 80px',
                      gap: 8,
                      padding: '10px 0',
                      borderBottom: '1px solid var(--border-subtle)',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--casio-blue)', fontWeight: 600 }}>
                      Cuota {inst.installment_number}/{inst.total_installments}
                    </span>
                    <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatCurrency(inst.amount, commitment.currency)}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {formatDate(inst.due_date)}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: 9,
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 6px',
                        borderRadius: 2,
                        background: isPaid ? 'rgba(74, 222, 128, 0.12)' : 'rgba(251, 191, 36, 0.12)',
                        color: isPaid ? 'var(--green-lcd)' : 'var(--yellow-warn)',
                        fontWeight: 600,
                        letterSpacing: '0.04em'
                      }}>
                        {isPaid ? 'PAGADA' : 'PENDIENTE'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            {installments.some(i => i.status === 'completed') || commitment.status === 'completed' ? (
              <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                HISTORIAL PRESERVADO · SOLO LECTURA
              </span>
            ) : (
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 2,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--red-alert)',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                ELIMINAR COMPROMISO
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-default)',
                borderRadius: 2,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text-primary)',
                padding: '6px 16px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600
              }}
            >
              CERRAR
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          No se encontró el compromiso.
        </div>
      )}
    </CasioModal>
  )
}
