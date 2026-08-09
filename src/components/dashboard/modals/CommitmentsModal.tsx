'use client'

import { useState, useEffect, useCallback } from 'react'
import CasioModal from './CasioModal'
import CommitmentDetailModal from './CommitmentDetailModal'
import { useAuth } from '@/components/providers/AuthProvider'
import { commitmentService, type Commitment, type InstallmentWithCommitment } from '@/lib/services/commitment.service'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'

interface CommitmentsModalProps {
  isOpen: boolean
  onClose: () => void
  refreshTrigger: number
  onRefresh: () => void
}

type Tab = 'commitments' | 'installments'

export default function CommitmentsModal({ isOpen, onClose, refreshTrigger, onRefresh }: CommitmentsModalProps) {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('commitments')
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [installments, setInstallments] = useState<InstallmentWithCommitment[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedCommitmentId, setSelectedCommitmentId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const load = useCallback(async () => {
    if (!user || !isOpen) return
    setLoading(true)
    try {
      const [cResult, iResult] = await Promise.all([
        commitmentService.getUserCommitments(user.id, { page: 1, pageSize: 50 }),
        commitmentService.getUserInstallments(user.id),
      ])
      setCommitments(cResult.data)
      setInstallments(iResult)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user, isOpen])

  useEffect(() => { load() }, [load, refreshTrigger])

  // KPIs
  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  let dueThisMonth = 0
  let totalPending = 0
  let nextDueDate: string | null = null

  installments.forEach(inst => {
    if (inst.status !== 'completed') {
      totalPending += inst.amount
      if (inst.due_date.startsWith(currentMonthKey)) {
        dueThisMonth += inst.amount
      }
      if (!nextDueDate || inst.due_date < nextDueDate) {
        nextDueDate = inst.due_date
      }
    }
  })

  const activeCount = commitments.filter(c => c.status !== 'completed').length

  // Group installments by month for Tab 2
  const grouped = (() => {
    const map: Record<string, { label: string; items: InstallmentWithCommitment[]; pending: { ARS: number; USD: number } }> = {}
    installments.forEach(inst => {
      const [year, month] = inst.due_date.split('-')
      const key = `${year}-${month}`
      if (!map[key]) {
        const d = new Date(Number(year), Number(month) - 1, 1)
        map[key] = {
          label: d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase(),
          items: [],
          pending: { ARS: 0, USD: 0 },
        }
      }
      map[key].items.push(inst)
      if (inst.status !== 'completed') {
        const cur = (inst.commitments?.currency ?? 'ARS') as 'ARS' | 'USD'
        map[key].pending[cur] += inst.amount
      }
    })
    return Object.keys(map).sort().map(k => ({ key: k, ...map[k] }))
  })()

  return (
    <>
      <CasioModal isOpen={isOpen} onClose={onClose} title="Centro de Control de Compromisos" size="xl">
        {/* Top KPI Header Banner */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 20,
          padding: 14,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 4
        }}>
          <div>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
              A PAGAR ESTE MES
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--yellow-warn)', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(dueThisMonth, 'ARS')}
            </span>
          </div>
          <div>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
              PRÓXIMO VENCIMIENTO
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--casio-blue)', fontFamily: 'var(--font-mono)' }}>
              {nextDueDate ? formatDate(nextDueDate) : '—'}
            </span>
          </div>
          <div>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
              PENDIENTE TOTAL
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(totalPending, 'ARS')}
            </span>
          </div>
          <div>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
              COMPRAS ACTIVAS
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {activeCount} {activeCount === 1 ? 'COMPRA' : 'COMPRAS'}
            </span>
          </div>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setTab('commitments')}
            style={{
              padding: '8px 16px',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: tab === 'commitments' ? 'var(--casio-blue)' : 'var(--text-muted)',
              borderBottom: tab === 'commitments' ? '2px solid var(--casio-blue)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 100ms ease',
            }}
          >
            COMPRAS ACTIVAS ({commitments.length})
          </button>

          <button
            onClick={() => setTab('installments')}
            style={{
              padding: '8px 16px',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: tab === 'installments' ? 'var(--casio-blue)' : 'var(--text-muted)',
              borderBottom: tab === 'installments' ? '2px solid var(--casio-blue)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 100ms ease',
            }}
          >
            PRÓXIMOS VENCIMIENTOS
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(4)].map((_, i) => <div key={i} style={{ height: 50, background: 'var(--border-subtle)', borderRadius: 4, opacity: 0.5 - i * 0.1 }} />)}
          </div>
        ) : tab === 'commitments' ? (
          commitments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em' }}>
              NO HAY COMPRAS O COMPROMISOS REGISTRADOS
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {commitments.map(c => {
                const cInsts = installments.filter(i => i.commitment_id === c.id)
                const paidCount = cInsts.filter(i => i.status === 'completed').length
                const totalInsts = cInsts.length || c.installments_count || 1
                const monthlyAmount = cInsts[0]?.amount || (c.amount / totalInsts)
                const paidAmount = cInsts.filter(i => i.status === 'completed').reduce((sum, i) => sum + i.amount, 0)
                const remainingAmount = Math.max(0, c.amount - paidAmount)
                const nextPendingInst = cInsts.find(i => i.status !== 'completed')
                const progressPct = (paidCount / totalInsts) * 100

                return (
                  <div
                    key={c.id}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 4,
                      padding: 14,
                      background: 'rgba(255, 255, 255, 0.015)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      cursor: 'pointer',
                      transition: 'border-color 150ms ease, background 150ms ease',
                    }}
                    className="c-commitment-card"
                    onClick={() => { setSelectedCommitmentId(c.id); setIsDetailOpen(true) }}
                  >
                    {/* Top Row: Title & Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {c.description || 'Sin descripción'}
                        </span>
                        <span style={{
                          fontSize: 9,
                          fontFamily: 'var(--font-mono)',
                          padding: '2px 6px',
                          borderRadius: 2,
                          background: 'rgba(200, 160, 255, 0.12)',
                          color: '#d8b4fe',
                          border: '1px solid rgba(200, 160, 255, 0.25)',
                          fontWeight: 600
                        }}>
                          {c.card_label || 'Crédito'}
                        </span>
                      </div>

                      <span style={{
                        fontSize: 9,
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 6px',
                        borderRadius: 2,
                        background: c.status === 'completed' ? 'rgba(74, 222, 128, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                        color: c.status === 'completed' ? 'var(--green-lcd)' : 'var(--casio-blue)',
                        fontWeight: 600,
                        letterSpacing: '0.04em'
                      }}>
                        {c.status === 'completed' ? 'COMPLETADO' : 'ACTIVO'}
                      </span>
                    </div>

                    {/* Middle Row: Amounts & Progress Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block' }}>
                          Monto Total: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(c.amount, c.currency)}</strong>
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}>
                          Saldo Restante: {formatCurrency(remainingAmount, c.currency)}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--casio-blue)', fontFamily: 'var(--font-mono)', display: 'block' }}>
                          {nextPendingInst 
                            ? `Cuota ${nextPendingInst.installment_number} de ${totalInsts} · ${formatCurrency(monthlyAmount, c.currency)}/mes`
                            : `${totalInsts} de ${totalInsts} cuotas pagadas`
                          }
                        </span>
                        {nextPendingInst ? (
                          <span style={{ fontSize: 10, color: 'var(--yellow-warn)', fontFamily: 'var(--font-mono)' }}>
                            Próximo pago: {formatDate(nextPendingInst.due_date)}
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, color: 'var(--green-lcd)', fontFamily: 'var(--font-mono)' }}>
                            Todas las cuotas al día
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="c-progress-track" style={{ height: 4, marginTop: 2 }}>
                      <div
                        className="c-progress-fill"
                        style={{
                          width: `${Math.max(progressPct, c.status === 'completed' ? 100 : 5)}%`,
                          background: c.status === 'completed' ? 'var(--green-lcd)' : 'var(--casio-blue)'
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          grouped.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em' }}>
              NO HAY CUOTAS REGISTRADAS
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {grouped.map(group => (
                <div key={group.key} style={{ border: '1px solid var(--border-subtle)', borderRadius: 4, padding: 14, background: 'rgba(255, 255, 255, 0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                    <div className="c-label" style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-primary)' }}>{group.label}</div>
                    <div>
                      {group.pending.ARS > 0 ? (
                        <span className="c-value" style={{ fontSize: 12, fontWeight: 700, color: 'var(--yellow-warn)' }}>
                          {formatCurrency(group.pending.ARS, 'ARS')} pendiente
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--green-lcd)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          TODAS LAS CUOTAS PAGADAS
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {group.items.map(inst => {
                      const isPaid = inst.status === 'completed'
                      return (
                        <div
                          key={inst.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 0',
                            borderBottom: '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                          }}
                          onClick={() => { setSelectedCommitmentId(inst.commitment_id); setIsDetailOpen(true) }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{
                              fontSize: 12,
                              color: isPaid ? 'var(--green-lcd)' : 'var(--yellow-warn)',
                              fontFamily: 'var(--font-mono)'
                            }}>
                              {isPaid ? '●' : '○'}
                            </span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                                {inst.commitments?.description || 'Compromiso'}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                                Cuota {inst.installment_number}/{inst.total_installments} · {inst.commitments?.card_label || 'Tarjeta'} · Vence: {formatDate(inst.due_date)}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div className="c-value" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {formatCurrency(inst.amount, inst.commitments?.currency ?? 'ARS')}
                            </div>
                            <span style={{
                              fontSize: 9,
                              fontFamily: 'var(--font-mono)',
                              padding: '2px 6px',
                              borderRadius: 2,
                              background: isPaid ? 'rgba(74, 222, 128, 0.12)' : 'rgba(251, 191, 36, 0.12)',
                              color: isPaid ? 'var(--green-lcd)' : 'var(--yellow-warn)',
                              fontWeight: 600,
                              letterSpacing: '0.04em',
                              marginTop: 4,
                              display: 'inline-block'
                            }}>
                              {isPaid ? 'PAGADA' : 'PENDIENTE'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </CasioModal>

      <CommitmentDetailModal
        commitmentId={selectedCommitmentId}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedCommitmentId(null) }}
        onDeleted={() => {
          onRefresh()
          load()
        }}
      />
    </>
  )
}
