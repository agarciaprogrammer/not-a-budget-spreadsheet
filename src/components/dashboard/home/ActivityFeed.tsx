'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useDashboardDate } from '@/components/providers/DashboardDateProvider'
import { transactionService, type Transaction } from '@/lib/services/transaction.service'
import { commitmentService, type InstallmentWithCommitment } from '@/lib/services/commitment.service'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { useCategoryTranslation } from '@/hooks/useCategoryTranslation'
import EditTransactionModal from '@/components/transactions/EditTransactionModal'
import CommitmentDetailModal from '@/components/dashboard/modals/CommitmentDetailModal'

export type FeedFilterTab = 'all' | 'transactions' | 'commitments'

export interface UnifiedFeedItem {
  id: string
  kind: 'transaction' | 'commitment'
  sortDate: string
  dateDisplay: string
  title: string
  rawCategoryName: string
  amount: number
  currency: 'ARS' | 'USD'
  // Transaction specific
  txType?: Transaction['type']
  isTransfer?: boolean
  fromAmount?: number
  fromCurrency?: string
  paymentId?: string | null
  rawTx?: Transaction
  // Commitment specific
  commitmentId?: string
  purchaseDate?: string
  dueDate?: string
  installmentNumber?: number
  totalInstallments?: number
  cardLabel?: string | null
  status?: 'pending' | 'completed'
  rawInst?: InstallmentWithCommitment
}

interface ActivityFeedProps {
  refreshTrigger: number
  onAddTransaction: () => void
  onAddCommitment?: () => void
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

export default function ActivityFeed({
  refreshTrigger,
  onAddTransaction,
  onAddCommitment,
  onRefresh,
}: ActivityFeedProps) {
  const { user } = useAuth()
  const { monthRange, selectedMonth } = useDashboardDate()
  const { translateCategoryName } = useCategoryTranslation()

  const [activeTab, setActiveTab] = useState<FeedFilterTab>('all')
  const [feedItems, setFeedItems] = useState<UnifiedFeedItem[]>([])
  const [txCount, setTxCount] = useState(0)
  const [commCount, setCommCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<string | null>(null)
  const [isCommitmentDetailOpen, setIsCommitmentDetailOpen] = useState(false)

  const startDate = monthRange.startDate
  const endDate = monthRange.endDate
  const userId = user?.id

  // Carga atómica sin loops de re-renderizado
  const loadData = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    try {
      // Carga en paralelo de transacciones, cuotas y categorías
      const [txResult, instResult, userCategories] = await Promise.all([
        transactionService.getUserTransactions(userId, {
          page: 1,
          pageSize: 100,
          dateRange: { startDate, endDate },
        }),
        commitmentService.getUserInstallments(userId, {
          startDate,
          endDate,
        }),
        transactionService.getUserCategories(userId),
      ])

      setTxCount(txResult.total)
      setCommCount(instResult.length)

      const catMap = new Map<string, string>()
      userCategories.forEach((c) => catMap.set(c.id, c.name))

      // Mapear Transacciones
      const txItems: UnifiedFeedItem[] = txResult.data.map((tx) => ({
        id: `tx-${tx.id}`,
        kind: 'transaction',
        sortDate: tx.date,
        dateDisplay: tx.date,
        title: tx.description || 'Sin descripción',
        rawCategoryName: tx.categories?.name ?? 'General',
        amount: tx.amount ?? 0,
        currency: (tx.currency ?? 'ARS') as 'ARS' | 'USD',
        txType: tx.type,
        isTransfer: tx.type === 'transfer',
        fromAmount: tx.from_amount ?? 0,
        fromCurrency: tx.from_currency ?? 'ARS',
        paymentId: tx.payment_id,
        rawTx: tx,
      }))

      // Mapear Cuotas / Compromisos (se ordena y muestra por la fecha de COMPRA real: commitment.date)
      const commItems: UnifiedFeedItem[] = instResult.map((inst) => {
        const comm = inst.commitments
        const catId = comm?.category_id
        const rawCatName = catId ? (catMap.get(catId) ?? 'Crédito') : 'Crédito'
        const purchaseDate = comm?.date || inst.due_date

        return {
          id: `comm-${inst.id}`,
          kind: 'commitment',
          sortDate: purchaseDate,
          dateDisplay: purchaseDate,
          title: comm?.description || 'Compra a Crédito',
          rawCategoryName: rawCatName,
          amount: inst.amount,
          currency: (comm?.currency ?? 'ARS') as 'ARS' | 'USD',
          commitmentId: inst.commitment_id,
          purchaseDate: comm?.date,
          dueDate: inst.due_date,
          installmentNumber: inst.installment_number,
          totalInstallments: inst.total_installments,
          cardLabel: comm?.card_label || 'Crédito',
          status: inst.status,
          rawInst: inst,
        }
      })

      // Unificar y ordenar por fecha descendente
      const combined = [...txItems, ...commItems].sort((a, b) => {
        if (a.sortDate !== b.sortDate) {
          return b.sortDate.localeCompare(a.sortDate)
        }
        return a.id.localeCompare(b.id)
      })

      setFeedItems(combined)
    } catch (e) {
      console.error('Error loading unified activity feed:', e)
    } finally {
      setLoading(false)
    }
  }, [userId, startDate, endDate])

  useEffect(() => {
    loadData()
  }, [loadData, refreshTrigger])

  useEffect(() => {
    setPage(1)
  }, [startDate, endDate, activeTab])

  const handleDeleteTransaction = async (id: string) => {
    if (!userId || !confirm('¿Eliminar esta transacción?')) return
    try {
      await transactionService.deleteTransaction(id, userId)
      if (onRefresh) onRefresh()
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteCommitment = async (commitmentId: string) => {
    if (!userId || !confirm('¿Eliminar este compromiso y todas sus cuotas?')) return
    try {
      await commitmentService.deleteCommitment(commitmentId, userId)
      if (onRefresh) onRefresh()
      loadData()
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

  // Filtrado por Tab
  const filteredFeed = feedItems.filter((item) => {
    if (activeTab === 'transactions') return item.kind === 'transaction'
    if (activeTab === 'commitments') return item.kind === 'commitment'
    return true
  })

  // Paginación
  const totalPages = Math.ceil(filteredFeed.length / pageSize)
  const paginatedFeed = filteredFeed.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="c-card" style={{ padding: '20px 24px' }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="c-label" style={{ marginBottom: 2, fontSize: 11, letterSpacing: '0.05em' }}>Recent Activity</div>
          {!loading && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {txCount} transaction{txCount !== 1 ? 's' : ''} · {commCount} credit commitment{commCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Acciones directas: + TRANSACTION y + COMMITMENT */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            id="activity-add-transaction"
            className="c-action-btn"
            style={{ fontSize: 9, padding: '5px 9px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}
            onClick={onAddTransaction}
          >
            + Transaction
          </button>

          {onAddCommitment && (
            <button
              id="activity-add-commitment"
              className="c-action-btn"
              style={{
                fontSize: 9,
                padding: '5px 9px',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                borderColor: 'var(--casio-blue)',
                color: 'var(--casio-blue)'
              }}
              onClick={onAddCommitment}
            >
              + Commitment
            </button>
          )}
        </div>
      </div>

      {/* Tabs de Filtro: ALL / TRANSACTIONS / COMMITMENTS */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
        {(['all', 'transactions', 'commitments'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? 'var(--bg-raised)' : 'none',
              border: '1px solid',
              borderColor: activeTab === tab ? 'var(--border-default)' : 'transparent',
              borderRadius: 2,
              padding: '4px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              transition: 'all 150ms ease'
            }}
          >
            {tab === 'all' ? 'All' : tab === 'transactions' ? 'Transactions' : 'Commitments'}
          </button>
        ))}
      </div>

      {/* Table Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: 42, background: 'var(--border-subtle)', borderRadius: 4, opacity: 0.6 - i * 0.1 }} />
          ))}
        </div>
      ) : paginatedFeed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', marginBottom: 8 }}>
            NO ACTIVITY FOUND
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="c-btn c-btn--ghost" onClick={onAddTransaction} style={{ fontSize: 11 }}>
              Add transaction
            </button>
            {onAddCommitment && (
              <button className="c-btn c-btn--ghost" onClick={onAddCommitment} style={{ fontSize: 11 }}>
                Add commitment
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '50px 1fr 140px',
            gap: 12,
            paddingBottom: 8,
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: 4,
          }}>
            <div className="c-label" style={{ fontSize: 9, letterSpacing: '0.06em' }}>DATE</div>
            <div className="c-label" style={{ fontSize: 9, letterSpacing: '0.06em' }}>FINANCIAL DETAIL</div>
            <div className="c-label" style={{ fontSize: 9, letterSpacing: '0.06em', textAlign: 'right' }}>AMOUNT / STATUS</div>
          </div>

          {/* Rows */}
          {paginatedFeed.map((item, idx) => {
            const translatedCategory = translateCategoryName(item.rawCategoryName)

            if (item.kind === 'transaction') {
              const tx = item.rawTx!
              const amountColor = typeColor(item.txType || 'expense')
              const sign = typeSign(item.txType || 'expense')
              const isSettlement = !!item.paymentId

              return (
                <div
                  key={item.id}
                  className="c-activity-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 1fr 140px',
                    gap: 12,
                    cursor: 'pointer',
                    padding: '12px 0',
                    borderBottom: idx === paginatedFeed.length - 1 ? 'none' : '1px solid var(--border-subtle)'
                  }}
                  onClick={() => { setSelectedTx(tx); setIsEditOpen(true) }}
                >
                  {/* Column 1: Date */}
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center' }}>
                    {getSmartDate(item.dateDisplay)}
                  </div>

                  {/* Column 2: Description & Badges */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                      <span>{translatedCategory}</span>
                      <span>·</span>
                      <span style={{ color: 'var(--text-muted)' }}>TRANSACTION</span>
                      {isSettlement && (
                        <>
                          <span>·</span>
                          <span style={{ color: 'var(--casio-blue)', fontSize: 9 }}>PAGO TARJETA</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Amount & Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: 2 }}>
                    {item.isTransfer ? (
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--casio-blue)' }}>
                        {formatCurrency(item.fromAmount ?? 0, item.fromCurrency as 'ARS' | 'USD')}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: amountColor }}>
                        {sign}{formatCurrency(item.amount, item.currency)}
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
                      onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(tx.id) }}
                      title="Delete"
                    >
                      DEL
                    </button>
                  </div>
                </div>
              )
            } else {
              // Commitment / Credit Item
              const commId = item.commitmentId!
              const isPaid = item.status === 'completed'
              const instLabel = `Cuota ${item.installmentNumber}/${item.totalInstallments}`

              return (
                <div
                  key={item.id}
                  className="c-activity-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 1fr 140px',
                    gap: 12,
                    padding: '12px 0',
                    cursor: 'pointer',
                    borderBottom: idx === paginatedFeed.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                    background: 'rgba(255, 255, 255, 0.015)'
                  }}
                  onClick={() => { setSelectedCommitmentId(commId); setIsCommitmentDetailOpen(true) }}
                >
                  {/* Column 1: Date (Fecha de Compra real: commitment.date) */}
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center' }}>
                    {getSmartDate(item.purchaseDate || item.dateDisplay)}
                  </div>

                  {/* Column 2: Description & Clean Credit Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </span>
                      <span style={{
                        fontSize: 8,
                        fontFamily: 'var(--font-mono)',
                        padding: '1px 5px',
                        borderRadius: 2,
                        background: 'rgba(200, 160, 255, 0.12)',
                        color: '#d8b4fe',
                        border: '1px solid rgba(200, 160, 255, 0.25)',
                        letterSpacing: '0.04em',
                        fontWeight: 600
                      }}>
                        CREDIT
                      </span>
                    </div>

                    <div style={{ fontSize: 10, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)', display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ color: 'var(--casio-blue)' }}>{instLabel}</span>
                      {item.dueDate && (
                        <>
                          <span>·</span>
                          <span>Vence: {formatDate(item.dueDate)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Amount & Status */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#e9d5ff' }}>
                        {formatCurrency(item.amount, item.currency)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{
                        fontSize: 8,
                        fontFamily: 'var(--font-mono)',
                        color: isPaid ? 'var(--green-lcd)' : 'var(--yellow-warn)',
                        textTransform: 'uppercase',
                        fontWeight: 600
                      }}>
                        {isPaid ? 'PAID' : 'PENDING'}
                      </span>
                      <button
                        style={{
                          fontSize: 8,
                          color: 'var(--text-disabled)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.05em',
                          padding: '2px 4px'
                        }}
                        onClick={(e) => { e.stopPropagation(); handleDeleteCommitment(commId) }}
                        title="Delete commitment"
                      >
                        DEL
                      </button>
                    </div>
                  </div>
                </div>
              )
            }
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
        onClose={() => { setIsEditOpen(false); setSelectedTx(null) }}
        onTransactionUpdated={onRefresh ?? loadData}
        transaction={selectedTx}
      />

      <CommitmentDetailModal
        commitmentId={selectedCommitmentId}
        isOpen={isCommitmentDetailOpen}
        onClose={() => { setIsCommitmentDetailOpen(false); setSelectedCommitmentId(null) }}
        onDeleted={() => {
          if (onRefresh) onRefresh()
          loadData()
        }}
      />
    </div>
  )
}
