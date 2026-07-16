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
  const { monthRange, selectedMonth } = useDashboardDate()
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

  const getSmartDate = (dateStr: string) => {
    if (!dateStr) return '—'
    try {
      const [y, m, d] = dateStr.split('-').map(Number)
      const selYear = selectedMonth.getFullYear()
      const selMonthNum = selectedMonth.getMonth() + 1
      
      if (y === selYear && m === selMonthNum) {
        return String(d).padStart(2, '0')
      }
      return formatDate(dateStr)
    } catch {
      return formatDate(dateStr)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="c-card" style={{ padding: '20px 24px' }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div className="c-label" style={{ marginBottom: 2, fontSize: 11, letterSpacing: '0.05em' }}>Recent Activity</div>
          {!loading && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {total} transaction{total !== 1 ? 's' : ''} this period
            </span>
          )}
        </div>
        <button
          id="activity-add-transaction"
          className="c-action-btn"
          style={{ fontSize: 9, padding: '5px 9px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}
          onClick={onAddTransaction}
        >
          + Transaction
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: 42, background: 'var(--border-subtle)', borderRadius: 4, opacity: 0.6 - i * 0.1 }} />
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
            gridTemplateColumns: '50px 1fr 130px',
            gap: 12,
            paddingBottom: 8,
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: 4,
          }}>
            <div className="c-label" style={{ fontSize: 9, letterSpacing: '0.06em' }}>DATE</div>
            <div className="c-label" style={{ fontSize: 9, letterSpacing: '0.06em' }}>LEDGER DETAIL</div>
            <div className="c-label" style={{ fontSize: 9, letterSpacing: '0.06em', textAlign: 'right' }}>AMOUNT</div>
          </div>

          {/* Rows */}
          {transactions.map((tx, idx) => {
            const category = tx.categories?.name ? translateCategoryName(tx.categories.name) : '—'
            const amountColor = typeColor(tx.type)
            const sign = typeSign(tx.type)
            const isTransfer = tx.type === 'transfer'

            return (
              <div
                key={tx.id}
                className="c-activity-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '50px 1fr 130px',
                  gap: 12,
                  cursor: 'pointer',
                  padding: '12px 0',
                  borderBottom: idx === transactions.length - 1 ? 'none' : '1px solid var(--border-subtle)'
                }}
                onClick={() => { setSelected(tx); setIsEditOpen(true) }}
              >
                {/* Column 1: Smart Date */}
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center' }}>
                  {getSmartDate(tx.date)}
                </div>

                {/* Column 2: Description & Category */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.description || '—'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    {category}
                  </div>
                </div>

                {/* Column 3: Amount & Action */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: 2 }}>
                  {isTransfer ? (
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--casio-blue)' }}>
                      {formatCurrency(tx.from_amount ?? 0, tx.from_currency ?? 'ARS')}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: amountColor }}>
                      {sign}{formatCurrency(tx.amount ?? 0, tx.currency ?? 'ARS')}
                    </span>
                  )}
                  <button
                    style={{
                      fontSize: 8,
                      color: 'var(--text-disabled)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.05em',
                      padding: '2px 4px',
                      marginTop: 2
                    }}
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', marginTop: 8 }}>
              <button
                className="c-month-btn"
                style={{ fontSize: 14, padding: '2px 8px' }}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ‹
              </button>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                {page} / {totalPages}
              </span>
              <button
                className="c-month-btn"
                style={{ fontSize: 14, padding: '2px 8px' }}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                ›
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
