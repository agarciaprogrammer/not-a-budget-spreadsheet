'use client'

import { useSummaryData } from '@/hooks/useSummaryData'
import { useCategoryBreakdown } from '@/hooks/useCategoryBreakdown'
import { formatCurrency } from '@/lib/utils/formatters'
import { useCategoryTranslation } from '@/hooks/useCategoryTranslation'

interface InsightsSectionProps {
  refreshTrigger: number
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="c-label" style={{ marginBottom: 10 }}>{children}</div>
  )
}

export default function InsightsSection({ refreshTrigger }: InsightsSectionProps) {
  const { summaryData, loading: summaryLoading } = useSummaryData(refreshTrigger)
  const { breakdownData, loading: breakdownLoading } = useCategoryBreakdown(refreshTrigger)
  const { translateCategoryName } = useCategoryTranslation()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Flow summary ── */}
      <div className="c-card" style={{ padding: '18px 20px' }}>
        <SectionLabel>Monthly Flow</SectionLabel>
        {summaryLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: 20, background: 'var(--border-subtle)', borderRadius: 3, opacity: 0.5 - i * 0.1 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <FlowRow label="Income" amount={summaryData.totalIncome} color="var(--green-lcd)" />
            <FlowRow label="Fixed expenses" amount={summaryData.totalFixedExpenses} color="var(--yellow-warn)" />
            <FlowRow label="Variable expenses" amount={summaryData.totalVariableExpenses} color="var(--red-alert)" />
            <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 8, paddingTop: 8 }}>
              <FlowRow
                label="Net balance"
                amount={summaryData.netBalance.ARS}
                color={summaryData.netBalance.ARS >= 0 ? 'var(--casio-blue)' : 'var(--red-alert)'}
                bold
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Category breakdown ── */}
      <div className="c-card" style={{ padding: '18px 20px' }}>
        <SectionLabel>Category Distribution</SectionLabel>
        {breakdownLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ height: 28, background: 'var(--border-subtle)', borderRadius: 3, opacity: 0.5 - i * 0.1 }} />
            ))}
          </div>
        ) : breakdownData.categories.length === 0 ? (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
            NO DATA
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {breakdownData.categories.slice(0, 6).map((cat, i) => (
              <CategoryBar
                key={i}
                name={translateCategoryName(cat.name)}
                amount={cat.value}
                percentage={cat.percentage}
                color={cat.color}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

function FlowRow({
  label,
  amount,
  color,
  bold = false,
}: {
  label: string
  amount: number
  color: string
  bold?: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>{label}</span>
      <span className="c-value" style={{ fontSize: 12, fontWeight: bold ? 700 : 500, color }}>
        {formatCurrency(amount, 'ARS')}
      </span>
    </div>
  )
}

function CategoryBar({
  name,
  amount,
  percentage,
  color,
}: {
  name: string
  amount: number
  percentage: number
  color: string
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
          {name}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {percentage.toFixed(1)}%
          </span>
          <span className="c-value" style={{ fontSize: 11, color: 'var(--text-primary)' }}>
            {formatCurrency(amount, 'ARS')}
          </span>
        </div>
      </div>
      <div className="c-progress-track">
        <div
          className="c-progress-fill"
          style={{ width: `${Math.min(percentage, 100)}%`, background: color, opacity: 0.8 }}
        />
      </div>
    </div>
  )
}
