'use client'

import { useState, useEffect } from 'react'
import { useMonthlyLimit } from '@/hooks/useMonthlyLimit'
import { transactionService } from '@/lib/services/transaction.service'
import { formatCurrency } from '@/lib/utils/formatters'
import { commitmentService } from '@/lib/services/commitment.service'
import { formatDateToYYYYMMDD } from '@/lib/utils/date-utils'
import type { User } from '@supabase/supabase-js'

interface HomeScreenProps {
  user: User
  refreshTrigger: number
  onOpenNetWorth: () => void
  onAddTransaction: () => void
  onAddCommitment: () => void
}

type FactStatus = 'ok' | 'warn' | 'alert' | 'neutral'
interface Fact { text: string; status: FactStatus }

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const DOT_COLOR: Record<FactStatus, string> = {
  ok: 'var(--green-lcd)',
  warn: 'var(--yellow-warn)',
  alert: 'var(--red-alert)',
  neutral: 'var(--text-disabled)',
}

const TEXT_COLOR: Record<FactStatus, string> = {
  ok: 'var(--text-primary)',
  warn: 'var(--yellow-warn)',
  alert: 'var(--red-alert)',
  neutral: 'var(--text-primary)',
}

export default function HomeScreen({
  user,
  refreshTrigger,
  onOpenNetWorth,
  onAddTransaction,
  onAddCommitment,
}: HomeScreenProps) {
  const [presentSummary, setPresentSummary] = useState({
    availableCapital: { ARS: 0, USD: 0 },
    committedCapital: { ARS: 0, USD: 0 },
  })
  const [sLoading, setSLoading] = useState(true)
  const { limit, percentUsed, remaining, isOverLimit, loading: lLoading } = useMonthlyLimit(user.id, refreshTrigger)
  const [pendingCount, setPendingCount] = useState(0)
  const [iLoading, setILoading] = useState(true)
  const [showIndicator, setShowIndicator] = useState(true)

  const displayName =
    user.user_metadata?.full_name?.split(' ')[0] ??
    user.email?.split('@')[0] ??
    'there'

  useEffect(() => {
    async function loadPresentData() {
      setSLoading(true)
      try {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        const data = await transactionService.getTransactionSummary(user.id, {
          dateRange: {
            startDate: formatDateToYYYYMMDD(start),
            endDate: formatDateToYYYYMMDD(end),
          }
        })
        setPresentSummary({
          availableCapital: data.availableCapital,
          committedCapital: data.committedCapital,
        })
      } catch (err) {
        console.error('Error loading present summary:', err)
      } finally {
        setSLoading(false)
      }
    }
    loadPresentData()
  }, [user.id, refreshTrigger])

  useEffect(() => {
    async function load() {
      setILoading(true)
      try {
        const all = await commitmentService.getUserInstallments(user.id)
        const now = new Date()
        const count = all.filter(i => {
          const [y, m] = i.due_date.split('-')
          return parseInt(y) === now.getFullYear() && parseInt(m) === now.getMonth() + 1 && i.status !== 'completed'
        }).length
        setPendingCount(count)
      } catch {
        setPendingCount(0)
      } finally {
        setILoading(false)
      }
    }
    load()
  }, [user.id, refreshTrigger])

  useEffect(() => {
    const el = document.getElementById('workspace')
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setShowIndicator(!e.isIntersecting), { threshold: 0.05 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const loading = sLoading || lLoading || iLoading
  const availableARS = presentSummary.availableCapital.ARS
  const availableUSD = presentSummary.availableCapital.USD
  const committedARS = presentSummary.committedCapital.ARS

  const overallStatus: FactStatus =
    isOverLimit || availableARS < 0 ? 'alert'
    : percentUsed > 80 || committedARS > availableARS * 0.8 ? 'warn'
    : 'ok'

  const overallMessage =
    overallStatus === 'alert' ? 'Requiere atención.'
    : overallStatus === 'warn' ? 'Hay elementos para revisar.'
    : 'Todo saludable.'

  const facts: Fact[] = loading ? [] : (() => {
    const r: Fact[] = []
    if (limit) {
      if (isOverLimit) {
        r.push({ text: 'Superaste el límite mensual de gastos variables.', status: 'alert' })
      } else if (percentUsed >= 80) {
        r.push({ text: `${percentUsed.toFixed(0)}% del límite mensual utilizado — cerca del máximo.`, status: 'warn' })
      } else if (percentUsed > 0) {
        r.push({ text: `${percentUsed.toFixed(0)}% del límite mensual utilizado.`, status: 'neutral' })
      }
      if (!isOverLimit && remaining > 0) {
        r.push({ text: `Quedan ${formatCurrency(remaining, 'ARS')} disponibles en presupuesto variable.`, status: 'neutral' })
      }
    }
    if (committedARS > 0) {
      r.push({ text: `${formatCurrency(committedARS, 'ARS')} comprometidos en cuotas pendientes.`, status: 'warn' })
    } else {
      r.push({ text: 'Sin compromisos activos este período.', status: 'ok' })
    }
    if (pendingCount === 0) {
      r.push({ text: 'Sin cuotas pendientes.', status: 'ok' })
    } else {
      r.push({ text: `${pendingCount} cuota${pendingCount > 1 ? 's' : ''} pendiente${pendingCount > 1 ? 's' : ''} este mes.`, status: 'warn' })
    }
    if (availableARS < 0) {
      r.push({ text: 'El capital disponible es negativo.', status: 'alert' })
    }
    return r
  })()

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',       // Centra horizontalmente
        justifyContent: 'center',  // Centra verticalmente
        padding: '0 32px',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Panel centrado */}
      <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: '36px' }}>

        {/* ── SECCIÓN 1: HEADER & STATUS ─────────────────────────── */}
        <div>
          {/* Nivel 3: Saludo */}
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.14em',
            color: 'var(--text-disabled)',
            textTransform: 'uppercase',
            margin: '0 0 6px',
          }}>
            {getGreeting()}
          </p>

          {/* Nivel 1: Nombre */}
          <h1 style={{
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            margin: '0 0 16px',
          }}>
            {displayName}.
          </h1>

          {/* Nivel 2: Estado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!loading && (
              <>
                <span
                  className={`c-dot c-dot--${overallStatus === 'alert' ? 'red' : overallStatus === 'warn' ? 'yellow' : 'green'}`}
                  style={{ flexShrink: 0 }}
                />
                <span style={{
                  fontSize: 14,
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em',
                }}>
                  {overallMessage}
                </span>
              </>
            )}
            {loading && (
              <div style={{ width: 140, height: 14, background: 'var(--border-subtle)', borderRadius: 2, opacity: 0.4 }} />
            )}
          </div>
        </div>

        {/* ── SECCIÓN 2: HECHOS CONTEXTUALES ─────────────────────── */}
        <div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[150, 180, 130].map((w, i) => (
                <div key={i} style={{ width: w, height: 14, background: 'var(--border-subtle)', borderRadius: 2, opacity: 0.3 }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {facts.slice(0, 4).map((fact, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: DOT_COLOR[fact.status],
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: 14,
                    color: TEXT_COLOR[fact.status],
                    lineHeight: 1.4,
                    fontWeight: 500,
                  }}>
                    {fact.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── SECCIÓN 3: CAPITAL ─────────────────────────────────── */}
        <div>
          {loading ? (
            <>
              <div style={{ width: 100, height: 10, background: 'var(--border-subtle)', borderRadius: 2, marginBottom: 8, opacity: 0.25 }} />
              <div style={{ width: 200, height: 26, background: 'var(--border-subtle)', borderRadius: 2, opacity: 0.4 }} />
            </>
          ) : (
            <>
              {/* Nivel 2: Label */}
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.1em',
                color: 'var(--text-disabled)',
                textTransform: 'uppercase',
                margin: '0 0 6px',
              }}>
                Capital disponible
              </p>

              {/* Nivel 1: Monto */}
              <button
                onClick={onOpenNetWorth}
                style={{
                  display: 'block',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                title="Ver detalle"
              >
                <span style={{
                  display: 'block',
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  color: availableARS >= 0 ? 'var(--text-primary)' : 'var(--red-alert)',
                  lineHeight: 1.1,
                }}>
                  {formatCurrency(availableARS, 'ARS')}
                </span>
              </button>

              {/* Nivel 3: USD */}
              {availableUSD !== 0 && (
                <span style={{
                  display: 'block',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-disabled)',
                  marginTop: 4,
                }}>
                  {formatCurrency(availableUSD, 'USD')}
                </span>
              )}
            </>
          )}
        </div>

        {/* ── SECCIÓN 4: ACCIONES ────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 28, marginTop: '8px' }}>
          <button
            id="qa-transaction"
            onClick={onAddTransaction}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              letterSpacing: '0.02em',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <span style={{ color: 'var(--text-disabled)', fontSize: 16, lineHeight: 1 }}>+</span>
            Transaction
          </button>

          <button
            id="qa-commitment"
            onClick={onAddCommitment}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              letterSpacing: '0.02em',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <span style={{ color: 'var(--text-disabled)', fontSize: 16, lineHeight: 1 }}>+</span>
            Commitment
          </button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          opacity: showIndicator ? 0.3 : 0,
          transition: 'opacity 400ms ease',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <span style={{
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.14em',
          color: 'var(--text-disabled)',
          textTransform: 'uppercase',
        }}>
          Workspace
        </span>
        <svg
          width="10" height="10" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"
          style={{ color: 'var(--text-disabled)', animation: 'home-bounce 2s ease infinite' }}
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      </div>

      <style>{`
        @keyframes home-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50%       { transform: translateY(3px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
