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
      <div className="c-card" style={{ padding: '20px 24px' }}>
        <div className="c-label" style={{ marginBottom: 16, fontSize: 11, letterSpacing: '0.05em' }}>Monthly Flow</div>
        {summaryLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: 24, background: 'var(--border-subtle)', borderRadius: 3, opacity: 0.5 - i * 0.1 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Top row: Income and Total Expenses side-by-side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>INCOME</div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--green-lcd)', marginTop: 4 }}>
                  {formatCurrency(summaryData.totalIncome, 'ARS')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL EXPENSES</div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--red-alert)', marginTop: 4 }}>
                  {formatCurrency(summaryData.totalFixedExpenses + summaryData.totalVariableExpenses, 'ARS')}
                </div>
              </div>
            </div>

            {/* Small breakdown detail with no lines */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.02em', padding: '0 2px' }}>
              <span>Fixed: {formatCurrency(summaryData.totalFixedExpenses, 'ARS')}</span>
              <span>Variable: {formatCurrency(summaryData.totalVariableExpenses, 'ARS')}</span>
            </div>

            {/* Simple Divider */}
            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

            {/* Key takeaway: Net Balance */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NET BALANCE</span>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>RESULT OF PERIOD</span>
              </div>
              <span style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: summaryData.netBalance.ARS >= 0 ? 'var(--casio-blue)' : 'var(--red-alert)'
              }}>
                {formatCurrency(summaryData.netBalance.ARS, 'ARS')}
              </span>
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
