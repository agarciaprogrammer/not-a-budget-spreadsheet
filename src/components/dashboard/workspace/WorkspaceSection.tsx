'use client'

import { useState, useEffect } from 'react'
import ActivityFeed from '@/components/dashboard/home/ActivityFeed'
import InsightsSection from '@/components/dashboard/home/InsightsSection'
import { useDashboardDate } from '@/components/providers/DashboardDateProvider'
import { useSummaryData } from '@/hooks/useSummaryData'
import { useAuth } from '@/components/providers/AuthProvider'
import { formatCurrency } from '@/lib/utils/formatters'
import { budgetService } from '@/lib/services/budget.service'

interface WorkspaceSectionProps {
  refreshTrigger: number
  onAddTransaction: () => void
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

  const netARS = summaryData.netBalance.ARS
  const netUSD = summaryData.netBalance.USD
  const availableARS = summaryData.availableCapital.ARS
  const availableUSD = summaryData.availableCapital.USD
  const committedARS = summaryData.committedCapital.ARS
  const committedUSD = summaryData.committedCapital.USD
  const spendingARS = summaryData.totalVariableExpenses

  const percentUsed = limit ? Math.min((spendingARS / limit) * 100, 100) : 0
  const limitHint = limit ? `${percentUsed.toFixed(0)}% of limit` : 'no limit'

  const loading = sLoading || lLoading

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

      {/* ── Compact Summary Cards (Rediseño minimalista de display plano) ──── */}
      <div
        style={{
          padding: '0 36px',
          maxWidth: 1100,
          margin: '0 auto 36px',
        }}
      >
        <div className="compact-cards-grid">
          {/* Card 1: Net Balance */}
          <button onClick={onOpenNetWorth} className="compact-card">
            <div className="compact-card-label">Net Balance</div>
            <div className="compact-card-value">
              {loading ? '...' : formatCurrency(netARS, 'ARS')}
            </div>
            {!loading && netUSD !== 0 && (
              <div className="compact-card-value-sub">
                {formatCurrency(netUSD, 'USD')}
              </div>
            )}
          </button>

          {/* Card 2: Available Capital */}
          <button onClick={onOpenNetWorth} className="compact-card">
            <div className="compact-card-label">Available Capital</div>
            <div className="compact-card-value">
              {loading ? '...' : formatCurrency(availableARS, 'ARS')}
            </div>
            {!loading && availableUSD !== 0 && (
              <div className="compact-card-value-sub">
                {formatCurrency(availableUSD, 'USD')}
              </div>
            )}
          </button>

          {/* Card 3: Committed Capital */}
          <button onClick={onOpenCommitments} className="compact-card">
            <div className="compact-card-label">Committed Capital</div>
            <div className="compact-card-value">
              {loading ? '...' : formatCurrency(committedARS, 'ARS')}
            </div>
            {!loading && committedUSD !== 0 && (
              <div className="compact-card-value-sub">
                {formatCurrency(committedUSD, 'USD')}
              </div>
            )}
          </button>

          {/* Card 4: Monthly Spending */}
          <button onClick={onOpenLimit} className="compact-card">
            <div className="compact-card-label">Monthly Spending</div>
            <div className="compact-card-value">
              {loading ? '...' : formatCurrency(spendingARS, 'ARS')}
            </div>
            {!loading && (
              <div className="compact-card-value-sub">
                {limitHint}
              </div>
            )}
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
              onRefresh={onRefresh}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <InsightsSection refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>

      <style>{`
        .compact-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }
        .compact-card {
          background: none;
          border: none;
          border-left: 2px solid var(--border-subtle);
          padding: 8px 16px;
          text-align: left;
          cursor: pointer;
          transition: border-color 200ms ease, background 200ms ease;
          display: block;
          width: 100%;
        }
        .compact-card:hover {
          border-left-color: var(--casio-blue);
          background: var(--bg-surface);
        }
        .compact-card-label {
          font-size: 9px;
          font-family: var(--font-mono);
          color: var(--text-disabled);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }
        .compact-card-value {
          font-size: 15px;
          font-weight: 700;
          font-family: var(--font-mono);
          color: var(--text-primary);
          line-height: 1.2;
        }
        .compact-card-value-sub {
          font-size: 11px;
          font-family: var(--font-mono);
          color: var(--text-muted);
          margin-top: 2px;
        }
        @media (max-width: 900px) {
          .workspace-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 780px) {
          .compact-cards-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; }
        }
        @media (max-width: 480px) {
          .compact-cards-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
