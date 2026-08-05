'use client'

import { useState, useEffect } from 'react'
import CasioModal from './CasioModal'
import { useSummaryData } from '@/hooks/useSummaryData'
import { useDashboardDate } from '@/components/providers/DashboardDateProvider'
import { formatCurrency } from '@/lib/utils/formatters'
import EditOpeningBalanceModal from '@/components/dashboard/EditOpeningBalanceModal'

interface AccountBalance {
  id: string
  name: string
  bank: string
  currency: 'ARS' | 'USD'
  current_balance: number
}

interface NetWorthModalProps {
  isOpen: boolean
  onClose: () => void
  refreshTrigger: number
  onSaved: () => void
}

function Row({ label, arsValue, usdValue, highlight }: { label: string; arsValue: number; usdValue?: number; highlight?: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <div className="c-value" style={{ fontSize: 13, fontWeight: 600, color: highlight ?? 'var(--text-primary)' }}>
          {formatCurrency(arsValue, 'ARS')}
        </div>
        {usdValue !== undefined && usdValue !== 0 && (
          <div className="c-value" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {formatCurrency(usdValue, 'USD')}
          </div>
        )}
      </div>
    </div>
  )
}

export default function NetWorthModal({ isOpen, onClose, refreshTrigger, onSaved }: NetWorthModalProps) {
  const { summaryData, loading } = useSummaryData(refreshTrigger)
  const { selectedMonth } = useDashboardDate()
  const [editOpen, setEditOpen] = useState(false)
  const [accounts, setAccounts] = useState<AccountBalance[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLoadingAccounts(true)
      fetch('/api/accounts')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setAccounts(data)
        })
        .catch(err => console.error('Failed to load accounts', err))
        .finally(() => setLoadingAccounts(false))
    }
  }, [isOpen, refreshTrigger])

  // Group accounts by Bank
  const accountsByBank: Record<string, AccountBalance[]> = {}
  accounts.forEach(acc => {
    if (!accountsByBank[acc.bank]) accountsByBank[acc.bank] = []
    accountsByBank[acc.bank].push(acc)
  })

  return (
    <>
      <CasioModal isOpen={isOpen} onClose={onClose} title="Balance Detail" subtitle="All values for selected period">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ height: 36, background: 'var(--border-subtle)', borderRadius: 3, opacity: 0.5 - i * 0.08 }} />
            ))}
          </div>
        ) : (
          <>
            <Row label="Opening Balance" arsValue={summaryData.openingBalance.ARS} usdValue={summaryData.openingBalance.USD} />
            <Row label="Total Income" arsValue={summaryData.totalIncome} highlight="var(--green-lcd)" />
            <Row label="Fixed Expenses" arsValue={summaryData.totalFixedExpenses} highlight="var(--yellow-warn)" />
            <Row label="Variable Expenses" arsValue={summaryData.totalVariableExpenses} highlight="var(--red-alert)" />

            <div style={{ borderTop: '2px solid var(--border-default)', marginTop: 4, paddingTop: 4 }}>
              <Row
                label="Net Balance"
                arsValue={summaryData.netBalance.ARS}
                usdValue={summaryData.netBalance.USD}
                highlight={summaryData.netBalance.ARS >= 0 ? 'var(--green-lcd)' : 'var(--red-alert)'}
              />
            </div>
            <Row label="Committed Capital" arsValue={summaryData.committedCapital.ARS} usdValue={summaryData.committedCapital.USD} highlight="var(--yellow-warn)" />
            <div style={{ borderTop: '2px solid var(--border-default)', marginTop: 4, paddingTop: 4 }}>
              <Row
                label="Available Capital"
                arsValue={summaryData.availableCapital.ARS}
                usdValue={summaryData.availableCapital.USD}
                highlight={summaryData.availableCapital.ARS >= 0 ? 'var(--casio-blue)' : 'var(--red-alert)'}
              />
            </div>

            {/* Distribution by Accounts Section */}
            <div style={{ marginTop: 20, paddingTop: 14, borderTop: '2px dashed var(--border-default)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 10 }}>
                Distribución por Cuentas
              </div>

              {loadingAccounts ? (
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cargando saldos por cuenta...</div>
              ) : Object.keys(accountsByBank).length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sin cuentas activas.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(accountsByBank).map(([bank, bankAccounts]) => (
                    <div key={bank} style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{bank}</div>
                      {bankAccounts.map(acc => (
                        <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', padding: '2px 0' }}>
                          <span>{acc.name}</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {formatCurrency(acc.current_balance, acc.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="c-btn c-btn--ghost"
                style={{ fontSize: 11 }}
                onClick={() => setEditOpen(true)}
              >
                Sincronizar Saldo
              </button>
            </div>
          </>
        )}
      </CasioModal>

      <EditOpeningBalanceModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        year={selectedMonth.getFullYear()}
        month={selectedMonth.getMonth() + 1}
        initialARS={summaryData.netBalance.ARS}
        initialUSD={summaryData.netBalance.USD}
        onSaved={() => { onSaved(); setEditOpen(false) }}
      />
    </>
  )
}
