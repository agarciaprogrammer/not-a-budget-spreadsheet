'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useDashboardDate } from '@/components/providers/DashboardDateProvider'
import { transactionService, type Transaction } from '@/lib/services/transaction.service'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { useCategoryTranslation } from '@/hooks/useCategoryTranslation'
import EditTransactionModal from '@/components/transactions/EditTransactionModal'

interface ActivityFeedProps {
  refreshTrigger: number
  onAddTransaction: () => void
  onRefresh?: () => void
}

function typeColor(type: Transaction['type']): string {
  switch (type) {
    case 'income':   return 'var(--green-lcd)'
    case 'expense':  return 'var(--red-alert)'
    case 'transfer': return 'var(--casio-blue)'
    case 'adjustment': return 'var(--text-secondary)'
    default: return 'var(--text-secondary)'
  }
}

function typeSign(type: Transaction['type']): string {
  switch (type) {
    case 'income': return '+'
    case 'expense': return '−'
    default: return ''
  }
}

function typeDot(type: Transaction['type']): string {
  switch (type) {
    case 'income':   return 'c-dot--green'
    case 'expense':  return 'c-dot--red'
    case 'transfer': return 'c-dot--blue'
    default:         return ''
  }
}

export default function ActivityFeed({ refreshTrigger, onAddTransaction, onRefresh }: ActivityFeedProps) {
  const { user } = useAuth()
  const { monthRange } = useDashboardDate()
  const { translateCategoryName } = useCategoryTranslation()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selected, setSelected] = useState<Transaction | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const result = await transactionService.getUserTransactions(user.id, {
        page,
        pageSize,
        dateRange: { startDate: monthRange.startDate, endDate: monthRange.endDate },
      })
      setTransactions(result.data)
      setTotal(result.total)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user, monthRange, page, pageSize])

  useEffect(() => { load() }, [load, refreshTrigger])
  useEffect(() => { setPage(1) }, [monthRange])

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Delete this transaction?')) return
    try {
      await transactionService.deleteTransaction(id, user.id)
      if (onRefresh) onRefresh()
    } catch (e) {
      console.error(e)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="c-card" style={{ padding: '20px 24px' }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="c-label" style={{ marginBottom: 2 }}>Recent Activity</div>
          {!loading && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {total} transaction{total !== 1 ? 's' : ''} this month
            </span>
          )}
        </div>
        <button
          id="activity-add-transaction"
          className="c-action-btn"
          style={{ fontSize: 10, padding: '6px 10px' }}
          onClick={onAddTransaction}
        >
          + Transaction
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: 36, background: 'var(--border-subtle)', borderRadius: 4, opacity: 0.6 - i * 0.1 }} />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', marginBottom: 8 }}>
            NO TRANSACTIONS
          </div>
          <button
            className="c-btn c-btn--ghost"
            onClick={onAddTransaction}
            style={{ fontSize: 11 }}
          >
            Add first transaction
          </button>
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '95px 1fr 90px 100px 72px',
            gap: 8,
            paddingBottom: 6,
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: 4,
          }}>
            {['DATE', 'DESCRIPTION', 'CATEGORY', 'AMOUNT', ''].map((h, i) => (
              <div key={i} className="c-label" style={{ textAlign: i >= 3 ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {transactions.map(tx => {
            const category = tx.categories?.name ? translateCategoryName(tx.categories.name) : '—'
            const amountColor = typeColor(tx.type)
            const sign = typeSign(tx.type)
            const dot = typeDot(tx.type)
            const isTransfer = tx.type === 'transfer'

            return (
              <div
                key={tx.id}
                className="c-activity-row"
                style={{ display: 'grid', gridTemplateColumns: '95px 1fr 90px 100px 72px', gap: 8, cursor: 'pointer' }}
                onClick={() => { setSelected(tx); setIsEditOpen(true) }}
              >
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className={`c-dot ${dot}`} style={{ flexShrink: 0 }} />
                  {formatDate(tx.date)}
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                  {tx.description || '—'}
                </div>

                <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {category}
                </div>

                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  {isTransfer ? (
                    <span className="c-value" style={{ fontSize: 11, color: 'var(--casio-blue)' }}>
                      {formatCurrency(tx.from_amount ?? 0, tx.from_currency ?? 'ARS')}
                    </span>
                  ) : (
                    <span className="c-value" style={{ fontSize: 12, fontWeight: 600, color: amountColor }}>
                      {sign}{formatCurrency(tx.amount ?? 0, tx.currency ?? 'ARS')}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                  <button
                    style={{ fontSize: 9, color: 'var(--text-disabled)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', padding: '2px 4px' }}
                    onClick={(e) => { e.stopPropagation(); handleDelete(tx.id) }}
                    title="Delete"
                  >
                    DEL
                  </button>
                </div>
              </div>
            )
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border-subtle)', marginTop: 8 }}>
              <button
                className="c-btn c-btn--ghost"
                style={{ fontSize: 11, padding: '5px 12px' }}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ← Prev
              </button>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {page} / {totalPages}
              </span>
              <button
                className="c-btn c-btn--ghost"
                style={{ fontSize: 11, padding: '5px 12px' }}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <EditTransactionModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setSelected(null) }}
        onTransactionUpdated={onRefresh ?? load}
        transaction={selected}
      />
    </div>
  )
}
