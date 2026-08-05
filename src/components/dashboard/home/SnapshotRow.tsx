'use client'

import { useSummaryData } from '@/hooks/useSummaryData'
import { useMonthlyLimit } from '@/hooks/useMonthlyLimit'
import { useAuth } from '@/components/providers/AuthProvider'
import { formatCurrency } from '@/lib/utils/formatters'

interface SnapshotRowProps {
  refreshTrigger: number
  onOpenNetWorth: () => void
  onOpenCommitments: () => void
  onOpenLimit: () => void
}

interface WidgetProps {
  label: string
  children: React.ReactNode
  onClick: () => void
  status?: 'ok' | 'warn' | 'alert' | 'default'
  hint?: string
}

function Widget({ label, children, onClick, status = 'default', hint }: WidgetProps) {
  const accentColor = {
    ok: 'var(--green-lcd)',
    warn: 'var(--yellow-warn)',
    alert: 'var(--red-alert)',
    default: 'var(--casio-blue)',
  }[status]

  return (
    <button
      onClick={onClick}
      className="c-widget"
      style={{
        padding: '16px 20px',
        textAlign: 'left',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accentColor, opacity: 0.6 }} />

      <div className="c-label" style={{ marginBottom: 10 }}>{label}</div>
      <div>{children}</div>
      {hint && (
        <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
          {hint}
        </div>
      )}
      {/* Click affordance */}
      <div style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 9, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
        DETAIL ›
      </div>
    </button>
  )
}

function CurrencyLine({ amount, currency, color }: { amount: number; currency: string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 2 }}>
      <span style={{ fontSize: 9, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: 1 }}>
        {currency}
      </span>
      <span className="c-value" style={{ fontSize: 18, fontWeight: 700, color: color ?? 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        {formatCurrency(amount, currency as 'ARS' | 'USD')}
      </span>
    </div>
  )
}

function SkeletonWidget() {
  return (
    <div className="c-widget" style={{ padding: '16px 20px', height: 120 }}>
      <div style={{ width: 60, height: 8, background: 'var(--border-default)', borderRadius: 2, marginBottom: 12, opacity: 0.6 }} />
      <div style={{ width: '80%', height: 22, background: 'var(--border-default)', borderRadius: 2, marginBottom: 6, opacity: 0.4 }} />
      <div style={{ width: '60%', height: 16, background: 'var(--border-default)', borderRadius: 2, opacity: 0.3 }} />
    </div>
  )
}

export default function SnapshotRow({
  refreshTrigger,
  onOpenNetWorth,
  onOpenCommitments,
  onOpenLimit,
}: SnapshotRowProps) {
  const { summaryData, loading } = useSummaryData(refreshTrigger)
  const { user } = useAuth()
  const { limit, percentUsed, isOverLimit, loading: limitLoading } = useMonthlyLimit(user?.id, refreshTrigger)

  if (loading || limitLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }} className="snapshot-grid">
        {[0, 1, 2, 3].map(i => <SkeletonWidget key={i} />)}
        <style>{`@media(max-width:780px){.snapshot-grid{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:480px){.snapshot-grid{grid-template-columns:1fr!important}}`}</style>
      </div>
    )
  }

  const netARS = summaryData.netBalance.ARS
  const netWorthStatus = netARS >= 0 ? 'ok' : 'alert'
  const committedARS = summaryData.committedCapital.ARS
  const availableARS = summaryData.availableCapital.ARS
  const availableStatus = availableARS > 0 ? 'ok' : 'alert'

  // Monthly spending widget status
  const spendingStatus = isOverLimit ? 'alert' : (percentUsed > 75 ? 'warn' : 'default')

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }} className="snapshot-grid">

      {/* Net Worth / Balance */}
      <Widget
        label="Net Balance"
        onClick={onOpenNetWorth}
        status={netWorthStatus}
        hint="click para sincronizar saldo"
      >
        <CurrencyLine amount={netARS} currency="ARS" color={netARS >= 0 ? 'var(--green-lcd)' : 'var(--red-alert)'} />
        {summaryData.netBalance.USD !== 0 && (
          <CurrencyLine amount={summaryData.netBalance.USD} currency="USD" color="var(--text-secondary)" />
        )}
      </Widget>

      {/* Available Capital */}
      <Widget
        label="Available Capital"
        onClick={onOpenNetWorth}
        status={availableStatus}
      >
        <CurrencyLine amount={availableARS} currency="ARS" color={availableARS > 0 ? 'var(--casio-blue)' : 'var(--red-alert)'} />
        {summaryData.availableCapital.USD !== 0 && (
          <CurrencyLine amount={summaryData.availableCapital.USD} currency="USD" color="var(--text-secondary)" />
        )}
      </Widget>

      {/* Committed Capital */}
      <Widget
        label="Committed Capital"
        onClick={onOpenCommitments}
        status={committedARS > 0 ? 'warn' : 'default'}
      >
        <CurrencyLine amount={committedARS} currency="ARS" color={committedARS > 0 ? 'var(--yellow-warn)' : 'var(--text-secondary)'} />
        {summaryData.committedCapital.USD !== 0 && (
          <CurrencyLine amount={summaryData.committedCapital.USD} currency="USD" color="var(--text-secondary)" />
        )}
      </Widget>

      {/* Monthly Spending / Limit */}
      <Widget
        label="Monthly Spending"
        onClick={onOpenLimit}
        status={spendingStatus}
        hint={limit ? `${percentUsed.toFixed(0)}% of limit used` : 'no limit set'}
      >
        <CurrencyLine
          amount={summaryData.totalVariableExpenses}
          currency="ARS"
          color={isOverLimit ? 'var(--red-alert)' : 'var(--text-primary)'}
        />
        {limit && (
          <div style={{ marginTop: 8 }}>
            <div className="c-progress-track">
              <div
                className="c-progress-fill"
                style={{
                  width: `${Math.min(percentUsed, 100)}%`,
                  background: isOverLimit ? 'var(--red-alert)' : percentUsed > 75 ? 'var(--yellow-warn)' : 'var(--casio-blue)',
                }}
              />
            </div>
          </div>
        )}
      </Widget>

      <style>{`
        @media(max-width:780px){.snapshot-grid{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:480px){.snapshot-grid{grid-template-columns:1fr!important}}
      `}</style>
    </div>
  )
}
