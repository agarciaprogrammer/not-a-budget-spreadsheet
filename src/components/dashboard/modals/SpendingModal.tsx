'use client'

import CasioModal from './CasioModal'
import { useSummaryData } from '@/hooks/useSummaryData'
import { useCategoryBreakdown } from '@/hooks/useCategoryBreakdown'
import { formatCurrency } from '@/lib/utils/formatters'
import { useCategoryTranslation } from '@/hooks/useCategoryTranslation'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface SpendingModalProps {
  isOpen: boolean
  onClose: () => void
  refreshTrigger: number
}

export default function SpendingModal({ isOpen, onClose, refreshTrigger }: SpendingModalProps) {
  const { summaryData, loading: summaryLoading } = useSummaryData(refreshTrigger)
  const { breakdownData, loading: breakdownLoading } = useCategoryBreakdown(refreshTrigger)
  const { translateCategoryName } = useCategoryTranslation()

  const loading = summaryLoading || breakdownLoading

  return (
    <CasioModal isOpen={isOpen} onClose={onClose} title="Monthly Spending" subtitle="Variable expense breakdown" size="xl">
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: 36, background: 'var(--border-subtle)', borderRadius: 3, opacity: 0.5 - i * 0.08 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 32 }} className="spending-modal-grid">
          {/* Left: category list */}
          <div>
            <div className="c-label" style={{ marginBottom: 12 }}>By Category</div>

            {breakdownData.categories.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
                NO DATA
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {breakdownData.categories.map((cat, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, display: 'inline-block', flexShrink: 0 }} />
                        {translateCategoryName(cat.name)}
                      </span>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {cat.percentage.toFixed(1)}%
                        </span>
                        <span className="c-value" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {formatCurrency(cat.value, 'ARS')}
                        </span>
                      </div>
                    </div>
                    <div className="c-progress-track">
                      <div
                        className="c-progress-fill"
                        style={{ width: `${Math.min(cat.percentage, 100)}%`, background: cat.color, opacity: 0.75 }}
                      />
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div style={{ borderTop: '1px solid var(--border-strong)', paddingTop: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total variable</span>
                  <span className="c-value" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatCurrency(breakdownData.totalAmount, 'ARS')}
                  </span>
                </div>
              </div>
            )}

            {/* Fixed vs variable */}
            <div style={{ marginTop: 24 }}>
              <div className="c-label" style={{ marginBottom: 12 }}>Fixed vs Variable</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Fixed</span>
                  <span className="c-value" style={{ fontSize: 13, color: 'var(--yellow-warn)', fontWeight: 600 }}>
                    {formatCurrency(summaryData.totalFixedExpenses, 'ARS')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Variable</span>
                  <span className="c-value" style={{ fontSize: 13, color: 'var(--red-alert)', fontWeight: 600 }}>
                    {formatCurrency(summaryData.totalVariableExpenses, 'ARS')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total expenses</span>
                  <span className="c-value" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatCurrency(summaryData.totalExpenses, 'ARS')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: mini pie chart */}
          <div>
            <div className="c-label" style={{ marginBottom: 12 }}>Distribution</div>
            {breakdownData.categories.length > 0 ? (
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdownData.categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {breakdownData.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} opacity={0.85} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-panel)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 4,
                        fontSize: 11,
                        color: 'var(--text-primary)',
                      }}
                      formatter={(value: number) => [formatCurrency(value, 'ARS'), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-disabled)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                NO DATA
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`@media(max-width:600px){.spending-modal-grid{grid-template-columns:1fr!important}}`}</style>
    </CasioModal>
  )
}
