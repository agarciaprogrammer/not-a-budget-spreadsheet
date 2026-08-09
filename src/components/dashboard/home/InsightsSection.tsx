'use client'

import { useSummaryData } from '@/hooks/useSummaryData'
import { useCategoryBreakdown } from '@/hooks/useCategoryBreakdown'
import { formatCurrency } from '@/lib/utils/formatters'
import { useCategoryTranslation } from '@/hooks/useCategoryTranslation'

interface InsightsSectionProps {
  refreshTrigger: number
}

export default function InsightsSection({ refreshTrigger }: InsightsSectionProps) {
  const { summaryData, loading: summaryLoading } = useSummaryData(refreshTrigger)
  const { breakdownData, loading: breakdownLoading } = useCategoryBreakdown(refreshTrigger)
  const { translateCategoryName } = useCategoryTranslation()

  const netCashMovement = summaryData.totalIncome - (summaryData.debitExpenses ?? 0)

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
            {/* SECTION 1: CASH FLOW (Movimiento Real de Caja) */}
            <div>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: 10, color: 'var(--text-disabled)', textTransform: 'uppercase' }}>
                💰 CASH FLOW (SALIDA REAL DE CAJA)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>INGRESOS</div>
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--green-lcd)', marginTop: 2 }}>
                    +{formatCurrency(summaryData.totalIncome, 'ARS')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>EFECTIVO / DÉBITO</div>
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--red-alert)', marginTop: 2 }}>
                    −{formatCurrency(summaryData.debitExpenses ?? 0, 'ARS')}
                  </div>
                </div>
              </div>

              {/* Movimiento Neto de Caja */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 10,
                paddingTop: 8,
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  MOVIMIENTO NETO CAJA
                </span>
                <span style={{
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: netCashMovement >= 0 ? 'var(--casio-blue)' : 'var(--red-alert)'
                }}>
                  {netCashMovement >= 0 ? '+' : ''}
                  {formatCurrency(netCashMovement, 'ARS')}
                </span>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '2px 0' }} />

            {/* SECTION 2: CONSUMPTION & CREDIT (Consumo del Período) */}
            <div>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: 10, color: 'var(--text-disabled)', textTransform: 'uppercase' }}>
                🛒 CONSUMPTION THIS MONTH
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>· Efectivo / Débito</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(summaryData.debitExpenses ?? 0, 'ARS')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>· Crédito (Pendiente)</span>
                  <span style={{ color: '#d8b4fe' }}>{formatCurrency(summaryData.creditExpenses ?? 0, 'ARS')}</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 4,
                  paddingTop: 6,
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                    CONSUMO TOTAL MES
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {formatCurrency(summaryData.totalExpenses, 'ARS')}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── Category breakdown ── */}
      <div className="c-card" style={{ padding: '20px 24px' }}>
        <div className="c-label" style={{ marginBottom: 20, fontSize: 11, letterSpacing: '0.05em' }}>Top Spending</div>
        {breakdownLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ height: 32, background: 'var(--border-subtle)', borderRadius: 3, opacity: 0.5 - i * 0.1 }} />
            ))}
          </div>
        ) : breakdownData.categories.length === 0 ? (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
            NO DATA
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {breakdownData.categories
              .slice()
              .sort((a, b) => b.value - a.value)
              .slice(0, 6)
              .map((cat, idx) => {
                const name = translateCategoryName(cat.name)
                const percentage = cat.percentage
                const amount = cat.value
                const color = cat.color

                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {/* Line 1: Name & Metric Details */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        {name}
                      </span>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {formatCurrency(amount, 'ARS')}
                        <span style={{ color: 'var(--text-disabled)', margin: '0 6px' }}>·</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{percentage.toFixed(1)}%</span>
                      </span>
                    </div>

                    {/* Line 2: Full-width LCD Progress Bar */}
                    <div style={{
                      height: 8,
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: 1,
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(percentage, 100)}%`,
                          background: `repeating-linear-gradient(90deg, ${color}, ${color} 6px, transparent 6px, transparent 8px)`,
                          transition: 'width 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

    </div>
  )
}
