'use client'

import { useState, useEffect, useCallback } from 'react'
import CasioModal from './CasioModal'
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

const STATUS_COLOR: Record<string, string> = {
  pending:   'var(--yellow-warn)',
  partial:   'var(--casio-blue)',
  completed: 'var(--green-lcd)',
}

const STATUS_LABEL: Record<string, string> = {
  pending:   'Pending',
  partial:   'Partial',
  completed: 'Done',
}

export default function CommitmentsModal({ isOpen, onClose, refreshTrigger, onRefresh }: CommitmentsModalProps) {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('commitments')
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [installments, setInstallments] = useState<InstallmentWithCommitment[]>([])
  const [loading, setLoading] = useState(true)

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

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Delete this commitment?')) return
    try {
      await commitmentService.deleteCommitment(id, user.id)
      onRefresh()
      load()
    } catch (e) {
      console.error(e)
    }
  }

  // Group installments by month
  const grouped = (() => {
    const map: Record<string, { label: string; items: InstallmentWithCommitment[]; pending: { ARS: number; USD: number } }> = {}
    installments.forEach(inst => {
      const [year, month] = inst.due_date.split('-')
      const key = `${year}-${month}`
      if (!map[key]) {
        const d = new Date(Number(year), Number(month) - 1, 1)
        map[key] = {
          label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
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
    <CasioModal isOpen={isOpen} onClose={onClose} title="Commitments & Installments" size="xl">
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)' }}>
        {(['commitments', 'installments'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
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
              color: tab === t ? 'var(--casio-blue)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--casio-blue)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 100ms ease',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(4)].map((_, i) => <div key={i} style={{ height: 40, background: 'var(--border-subtle)', borderRadius: 3, opacity: 0.5 - i * 0.1 }} />)}
        </div>
      ) : tab === 'commitments' ? (
        commitments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em' }}>
            NO COMMITMENTS
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 110px 90px 70px 50px', gap: 8, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
              {['DATE', 'DESCRIPTION', 'AMOUNT', 'DUE DATE', 'STATUS', ''].map((h, i) => (
                <div key={i} className="c-label">{h}</div>
              ))}
            </div>
            {commitments.map(c => (
              <div
                key={c.id}
                style={{ display: 'grid', gridTemplateColumns: '90px 1fr 110px 90px 70px 50px', gap: 8, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}
              >
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{formatDate(c.date)}</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description || '—'}</span>
                <span className="c-value" style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{formatCurrency(c.amount, c.currency)}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{formatDate(c.due_date)}</span>
                <span style={{ fontSize: 10, color: STATUS_COLOR[c.status], fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.06em' }}>
                  {STATUS_LABEL[c.status]}
                </span>
                <button
                  onClick={() => handleDelete(c.id)}
                  style={{ fontSize: 9, color: 'var(--text-disabled)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
                >
                  DEL
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        grouped.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em' }}>
            NO INSTALLMENTS
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {grouped.map(group => (
              <div key={group.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div className="c-label">{group.label.toUpperCase()}</div>
                  <div style={{ textAlign: 'right' }}>
                    {group.pending.ARS > 0 && (
                      <span className="c-value" style={{ fontSize: 12, color: 'var(--yellow-warn)' }}>
                        {formatCurrency(group.pending.ARS, 'ARS')} pending
                      </span>
                    )}
                    {group.pending.ARS === 0 && group.pending.USD === 0 && (
                      <span style={{ fontSize: 11, color: 'var(--green-lcd)', fontFamily: 'var(--font-mono)' }}>ALL PAID</span>
                    )}
                  </div>
                </div>
                {group.items.map(inst => (
                  <div key={inst.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{inst.commitments?.description || 'Commitment'}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                        Installment {inst.installment_number}/{inst.total_installments}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="c-value" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatCurrency(inst.amount, inst.commitments?.currency ?? 'ARS')}
                      </div>
                      <div style={{ fontSize: 9, color: STATUS_COLOR[inst.status], fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', fontWeight: 600, marginTop: 2 }}>
                        {inst.status === 'completed' ? 'PAID' : 'PENDING'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      )}
    </CasioModal>
  )
}
