'use client'

import { useState, useEffect } from 'react'
import ActivityFeed from '@/components/dashboard/home/ActivityFeed'
import InsightsSection from '@/components/dashboard/home/InsightsSection'
import { useDashboardDate } from '@/components/providers/DashboardDateProvider'
import { useSummaryData } from '@/hooks/useSummaryData'
import { useAuth } from '@/components/providers/AuthProvider'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { budgetService } from '@/lib/services/budget.service'
import { commitmentService } from '@/lib/services/commitment.service'
import { transactionService } from '@/lib/services/transaction.service'

interface WorkspaceSectionProps {
  refreshTrigger: number
  onAddTransaction: () => void
  onAddCommitment?: () => void
  onRefresh: () => void
  onOpenNetWorth: () => void
  onOpenCommitments: () => void
  onOpenLimit: () => void
}

function formatMonthCompact(date: Date): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const year = date.getFullYear().toString().slice(-2)
  return `${month} '${year}`
}

export default function WorkspaceSection({
  refreshTrigger,
  onAddTransaction,
  onAddCommitment,
  onRefresh,
  onOpenNetWorth,
  onOpenCommitments,
  onOpenLimit,
}: WorkspaceSectionProps) {
  const { selectedMonth, goToPreviousMonth, goToNextMonth, goToCurrentMonth } = useDashboardDate()
  const { user } = useAuth()
  const { summaryData, loading: sLoading } = useSummaryData(refreshTrigger)
  const [limit, setLimit] = useState<number | null>(null)
  const [lLoading, setLLoading] = useState(true)

  // Local state for commitments details
  const [commitmentsCount, setCommitmentsCount] = useState<number>(0)
  const [nextCommitmentDate, setNextCommitmentDate] = useState<string | null>(null)
  const [cLoading, setCLoading] = useState(false)

  // Local state for previous month balance (to calculate variation)
  const [prevNetBalance, setPrevNetBalance] = useState<{ ARS: number; USD: number } | null>(null)
  const [vLoading, setVLoading] = useState(false)

  const isCurrentMonth =
    selectedMonth.getMonth() === new Date().getMonth() &&
    selectedMonth.getFullYear() === new Date().getFullYear()

  // Carga local del límite mensual para el Workspace
  useEffect(() => {
    async function loadLimit() {
      if (!user) return
      setLLoading(true)
      try {
        const fetchedLimit = await budgetService.getMonthlyLimit(
          user.id,
          selectedMonth.getFullYear(),
          selectedMonth.getMonth() + 1
        )
        setLimit(fetchedLimit)
      } catch (err) {
        console.error('Error fetching monthly limit for Workspace:', err)
      } finally {
        setLLoading(false)
      }
    }
    loadLimit()
  }, [user, selectedMonth, refreshTrigger])

  // Load installments data for Widget 3 count & next due date
  useEffect(() => {
    async function loadInstallments() {
      if (!user) return
      setCLoading(true)
      try {
        const selYear = selectedMonth.getFullYear()
        const selMonthNum = selectedMonth.getMonth() + 1
        
        const lastDay = new Date(selYear, selMonthNum, 0).getDate()
        const startDate = `${selYear}-${String(selMonthNum).padStart(2, '0')}-01`
        const endDate = `${selYear}-${String(selMonthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

        const inPeriod = await commitmentService.getUserInstallments(user.id, {
          startDate,
          endDate,
          status: 'pending'
        })
        
        setCommitmentsCount(inPeriod.length)

        if (inPeriod.length > 0) {
          const sorted = [...inPeriod].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
          setNextCommitmentDate(sorted[0].due_date)
        } else {
          // Find next future pending installment
          const nextMonthStart = `${selYear}-${String(selMonthNum + 1).padStart(2, '0')}-01`
          const future = await commitmentService.getUserInstallments(user.id, {
            startDate: nextMonthStart,
            status: 'pending'
          })
          if (future.length > 0) {
            setNextCommitmentDate(future[0].due_date)
          } else {
            setNextCommitmentDate(null)
          }
        }
      } catch (err) {
        console.error('Error fetching installments for widget:', err)
      } finally {
        setCLoading(false)
      }
    }
    loadInstallments()
  }, [user, selectedMonth, refreshTrigger])

  // Load previous month Net Balance
  useEffect(() => {
    async function loadPreviousMonthData() {
      if (!user) return
      setVLoading(true)
      try {
        const prevMonthDate = new Date(selectedMonth)
        prevMonthDate.setMonth(prevMonthDate.getMonth() - 1)
        const prevYear = prevMonthDate.getFullYear()
        const prevMonthNum = prevMonthDate.getMonth() + 1
        
        const prevStartDate = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-01`
        const prevLastDay = new Date(prevYear, prevMonthNum, 0).getDate()
        const prevEndDate = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-${String(prevLastDay).padStart(2, '0')}`

        const summary = await transactionService.getTransactionSummary(user.id, {
          dateRange: {
            startDate: prevStartDate,
            endDate: prevEndDate
          }
        })
        setPrevNetBalance(summary.netBalance)
      } catch (err) {
        console.error('Error fetching previous month balance:', err)
      } finally {
        setVLoading(false)
      }
    }
    loadPreviousMonthData()
  }, [user, selectedMonth, refreshTrigger])

  const netARS = summaryData.netBalance.ARS
  const netUSD = summaryData.netBalance.USD
  const availableARS = summaryData.availableCapital.ARS
  const availableUSD = summaryData.availableCapital.USD
  const committedARS = summaryData.committedCapital.ARS
  const committedUSD = summaryData.committedCapital.USD
  const spendingARS = summaryData.totalVariableExpenses

  const percentUsed = limit ? Math.min((spendingARS / limit) * 100, 100) : 0

  const loading = sLoading || lLoading

  // Calculate liquidity/available percentage
  const netARSVal = Math.max(netARS, 0)
  let availablePercent = 100
  if (netARSVal > 0) {
    availablePercent = Math.max(0, Math.min(100, (availableARS / netARSVal) * 100))
  } else if (availableARS <= 0) {
    availablePercent = 0
  }

  let availabilityStatus = 'OPTIMAL'
  let availabilityDot = 'green'
  if (availablePercent < 40) {
    availabilityStatus = 'CRITICAL'
    availabilityDot = 'red'
  } else if (availablePercent < 80) {
    availabilityStatus = 'RESTRICTED'
    availabilityDot = 'yellow'
  }

  // Calculate Net Worth percentage change vs previous month
  let variationPercentARS: number | null = null
  if (prevNetBalance && prevNetBalance.ARS !== 0) {
    variationPercentARS = ((netARS - prevNetBalance.ARS) / Math.abs(prevNetBalance.ARS)) * 100
  }

  return (
    <div
      id="workspace"
      style={{
        borderTop: '1px solid var(--border-default)',
        background: 'var(--bg-base)',
        minHeight: '100vh',
        boxSizing: 'border-box',
        paddingTop: 54,
      }}
    >
      {/* ── Workspace Header & Month Selector ─────────────────── */}
      <div
        style={{
          padding: '0 36px',
          maxWidth: 1100,
          margin: '0 auto 36px',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.18em',
            color: 'var(--text-disabled)',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: 8,
          }}
        >
          Workspace
        </span>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
          <button
            className="c-month-btn"
            onClick={goToPreviousMonth}
            aria-label="Previous month"
            style={{ fontSize: 18 }}
          >
            ‹
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 140 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: isCurrentMonth ? 'var(--casio-blue)' : 'var(--text-primary)',
              }}
            >
              {formatMonthCompact(selectedMonth)}
            </span>
            {!isCurrentMonth && (
              <button
                onClick={goToCurrentMonth}
                style={{
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: 3,
                  textTransform: 'uppercase',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                → today
              </button>
            )}
          </div>

          <button
            className="c-month-btn"
            onClick={goToNextMonth}
            aria-label="Next month"
            style={{ fontSize: 18 }}
          >
            ›
          </button>
        </div>

        <div style={{ height: 1, background: 'var(--border-subtle)', marginTop: 16 }} />
      </div>

      {/* ── Compact Summary Widgets (Rediseño de display plano LCD) ──── */}
      <div
        style={{
          padding: '0 36px',
          maxWidth: 1100,
          margin: '0 auto 36px',
        }}
      >
        <div className="widget-grid">
          {/* Widget 1: Patrimonio */}
          <button onClick={onOpenNetWorth} className="workspace-widget">
            <div className="widget-question">¿Cuál es mi patrimonio actual?</div>
            <div className="widget-header-row">
              <span className="widget-label">Patrimonio</span>
            </div>
            
            <div className="widget-main-value">
              {loading ? '...' : formatCurrency(netARS, 'ARS')}
            </div>
            
            <div className="widget-footer-row">
              <div className="widget-sub-value">
                {loading ? '...' : formatCurrency(netUSD, 'USD')}
              </div>
              
              {!loading && !vLoading && variationPercentARS !== null ? (
                <div className={`widget-badge ${variationPercentARS >= 0 ? 'badge-positive' : 'badge-negative'}`}>
                  {variationPercentARS >= 0 ? '▲' : '▼'} {Math.abs(variationPercentARS).toFixed(1)}% vs. mes ant.
                </div>
              ) : (
                <div className="widget-badge badge-neutral">—</div>
              )}
            </div>
          </button>

          {/* Widget 2: Capital Disponible */}
          <button onClick={onOpenNetWorth} className="workspace-widget">
            <div className="widget-question">¿Cuánto dinero puedo utilizar?</div>
            <div className="widget-header-row">
              <span className="widget-label">Capital Disponible</span>
            </div>
            
            <div className="widget-main-value">
              {loading ? '...' : formatCurrency(availableARS, 'ARS')}
            </div>
            
            <div className="widget-footer-row">
              <div className="widget-sub-value">
                {loading ? '...' : availableUSD !== 0 ? formatCurrency(availableUSD, 'USD') : `${availablePercent.toFixed(0)}% disponible`}
              </div>
              
              <div className="widget-status-indicator">
                <span className={`c-dot c-dot--${availabilityDot}`} />
                <span className={`status-text-${availabilityDot}`}>
                  {availableUSD !== 0 ? `${availablePercent.toFixed(0)}% libre` : availabilityStatus}
                </span>
              </div>
            </div>
          </button>

          {/* Widget 3: Compromisos */}
          <button onClick={onOpenCommitments} className="workspace-widget">
            <div className="widget-question">¿Tengo algo pendiente?</div>
            <div className="widget-header-row">
              <span className="widget-label">Compromisos</span>
            </div>
            
            <div className="widget-main-value">
              {loading || cLoading ? '...' : 
               committedARS === 0 && committedUSD === 0 ? formatCurrency(0, 'ARS') :
               committedARS > 0 ? formatCurrency(committedARS, 'ARS') : 
               formatCurrency(committedUSD, 'USD')}
            </div>
            
            <div className="widget-footer-row">
              <div className="widget-sub-value">
                {cLoading ? '...' : 
                 commitmentsCount === 0 ? 'Sin cuotas pendientes' : 
                 `${commitmentsCount} pendiente${commitmentsCount === 1 ? '' : 's'}${committedARS > 0 && committedUSD > 0 ? ` (+ ${formatCurrency(committedUSD, 'USD')})` : ''}`}
              </div>
              
              {!cLoading && nextCommitmentDate ? (
                <div className={`widget-badge ${commitmentsCount > 0 ? 'badge-warn' : 'badge-neutral'}`}>
                  Próximo: {formatDate(nextCommitmentDate, { month: 'short', day: 'numeric' })}
                </div>
              ) : (
                <div className="widget-badge badge-ok">
                  ✔ Al día
                </div>
              )}
            </div>
          </button>

          {/* Widget 4: Gasto Mensual */}
          <button onClick={onOpenLimit} className="workspace-widget">
            <div className="widget-question">¿Cómo viene mi presupuesto?</div>
            <div className="widget-header-row">
              <span className="widget-label">Gasto Mensual</span>
            </div>
            
            <div className="widget-main-value">
              {loading ? '...' : formatCurrency(spendingARS, 'ARS')}
            </div>
            
            <div className="widget-footer-row">
              <div className="widget-progress-container">
                <div className="lcd-progress-bar">
                  {[...Array(10)].map((_, i) => {
                    const blockPercent = (i + 1) * 10
                    const isActive = percentUsed >= blockPercent
                    const isLimitExceeded = percentUsed >= 90
                    return (
                      <div
                        key={i}
                        className={`lcd-progress-block ${isActive ? (isLimitExceeded ? 'block-exceeded' : 'block-active') : 'block-inactive'}`}
                      />
                    )
                  })}
                </div>
                <span className="progress-hint-text">
                  {limit ? `${percentUsed.toFixed(0)}% del límite` : 'Sin límite'}
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ── Content Grid ───────────────────────────────── */}
      <div
        style={{
          padding: '0 36px 72px',
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}
          className="workspace-grid"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <ActivityFeed
              refreshTrigger={refreshTrigger}
              onAddTransaction={onAddTransaction}
              onAddCommitment={onAddCommitment}
              onRefresh={onRefresh}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <InsightsSection refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>

      <style>{`
        .widget-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid var(--border-subtle);
          border-bottom: 1px solid var(--border-subtle);
          background: transparent;
          margin-bottom: 24px;
        }
        .workspace-widget {
          background: transparent;
          border: none;
          border-right: 1px solid var(--border-subtle);
          padding: 18px 20px;
          text-align: left;
          cursor: pointer;
          transition: background 180ms ease, border-color 180ms ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 145px;
          position: relative;
          width: 100%;
        }
        .workspace-widget:last-child {
          border-right: none;
        }
        .workspace-widget::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: transparent;
          transition: background 180ms ease;
        }
        .workspace-widget:hover::before {
          background: var(--casio-blue);
        }
        .workspace-widget:hover {
          background: var(--bg-surface);
        }
        .widget-question {
          font-size: 9px;
          font-weight: 500;
          font-family: var(--font-mono);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }
        .widget-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .widget-label {
          font-size: 11px;
          font-weight: 700;
          font-family: var(--font-mono);
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .widget-main-value {
          font-size: 20px;
          font-weight: 700;
          font-family: var(--font-mono);
          color: var(--text-primary);
          line-height: 1;
          margin-bottom: 12px;
          letter-spacing: -0.01em;
        }
        .widget-footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          gap: 8px;
          width: 100%;
        }
        .widget-sub-value {
          font-size: 11px;
          font-family: var(--font-mono);
          color: var(--text-secondary);
        }
        .widget-badge {
          font-size: 9px;
          font-family: var(--font-mono);
          padding: 2px 6px;
          border-radius: 3px;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .badge-positive {
          background: var(--green-lcd-dim);
          color: var(--green-lcd);
          border: 1px solid rgba(0, 230, 118, 0.2);
        }
        .badge-negative {
          background: var(--red-alert-dim);
          color: var(--red-alert);
          border: 1px solid rgba(255, 61, 61, 0.2);
        }
        .badge-neutral {
          background: var(--bg-base);
          color: var(--text-muted);
          border: 1px solid var(--border-subtle);
        }
        .badge-warn {
          background: var(--yellow-warn-dim);
          color: var(--yellow-warn);
          border: 1px solid rgba(255, 202, 40, 0.2);
        }
        .badge-ok {
          background: var(--green-lcd-dim);
          color: var(--green-lcd);
          border: 1px solid rgba(0, 230, 118, 0.2);
        }
        .widget-status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 9px;
          font-family: var(--font-mono);
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .status-text-green { color: var(--green-lcd); }
        .status-text-yellow { color: var(--yellow-warn); }
        .status-text-red { color: var(--red-alert); }
        .widget-progress-container {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
        }
        .lcd-progress-bar {
          display: flex;
          gap: 3px;
          width: 100%;
        }
        .lcd-progress-block {
          flex: 1;
          height: 6px;
          border-radius: 1px;
          transition: background-color 200ms ease;
        }
        .block-active {
          background: var(--casio-blue);
          box-shadow: 0 0 3px var(--casio-blue);
        }
        .block-exceeded {
          background: var(--red-alert);
          box-shadow: 0 0 3px var(--red-alert);
        }
        .block-inactive {
          background: var(--bg-base);
          border: 1px solid var(--border-subtle);
        }
        .progress-hint-text {
          font-size: 9px;
          font-family: var(--font-mono);
          color: var(--text-muted);
          text-align: right;
          width: 100%;
          display: block;
        }
        @media (max-width: 900px) {
          .workspace-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 1024px) {
          .widget-grid {
            grid-template-columns: repeat(2, 1fr);
            border-bottom: none;
          }
          .workspace-widget {
            border-bottom: 1px solid var(--border-subtle);
          }
          .workspace-widget:nth-child(2) {
            border-right: none;
          }
          .workspace-widget:nth-child(4) {
            border-right: none;
          }
        }
        @media (max-width: 600px) {
          .widget-grid {
            grid-template-columns: 1fr;
          }
          .workspace-widget {
            border-right: none;
            border-bottom: 1px solid var(--border-subtle);
          }
        }
      `}</style>
    </div>
  )
}
