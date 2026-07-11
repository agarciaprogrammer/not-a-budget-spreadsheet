'use client'

import { useState } from 'react'
import CasioModal from './CasioModal'
import { useSummaryData } from '@/hooks/useSummaryData'
import { useDashboardDate } from '@/components/providers/DashboardDateProvider'
import { formatCurrency } from '@/lib/utils/formatters'
import EditOpeningBalanceModal from '@/components/dashboard/EditOpeningBalanceModal'

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
      padding: '10px 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <div className="c-value" style={{ fontSize: 14, fontWeight: 600, color: highlight ?? 'var(--text-primary)' }}>
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

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
              <button
                className="c-btn c-btn--ghost"
                style={{ fontSize: 11 }}
                onClick={() => setEditOpen(true)}
              >
                Edit Opening Balance
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
        initialARS={summaryData.openingBalance.ARS}
        initialUSD={summaryData.openingBalance.USD}
        onSaved={() => { onSaved(); setEditOpen(false) }}
      />
    </>
  )
}
