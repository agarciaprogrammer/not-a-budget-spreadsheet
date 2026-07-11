'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useMonthlyLimit } from '@/hooks/useMonthlyLimit'
import { useSummaryData } from '@/hooks/useSummaryData'

interface AlertBannerProps {
  userId: string
  refreshTrigger: number
}

interface Alert {
  type: 'warn' | 'alert' | 'ok'
  message: string
}

export default function AlertBanner({ userId, refreshTrigger }: AlertBannerProps) {
  const { limit, isOverLimit, percentUsed, loading: limitLoading } = useMonthlyLimit(userId, refreshTrigger)
  const { summaryData, loading: summaryLoading } = useSummaryData(refreshTrigger)

  if (limitLoading || summaryLoading) return null

  const alerts: Alert[] = []

  // Monthly limit alerts
  if (limit && isOverLimit) {
    alerts.push({ type: 'alert', message: 'Monthly spending limit exceeded.' })
  } else if (limit && percentUsed >= 80) {
    alerts.push({ type: 'warn', message: `Variable spending at ${percentUsed.toFixed(0)}% of monthly limit.` })
  }

  // Negative capital alert
  if (summaryData.availableCapital.ARS < 0) {
    alerts.push({ type: 'alert', message: 'Available capital is negative.' })
  }

  // Committed capital warning
  if (summaryData.committedCapital.ARS > summaryData.availableCapital.ARS && summaryData.availableCapital.ARS > 0) {
    alerts.push({ type: 'warn', message: 'Committed capital exceeds available capital.' })
  }

  // All clear
  if (alerts.length === 0) {
    return (
      <div className="c-alert c-alert--ok" style={{ marginBottom: 20 }}>
        <span className="c-dot c-dot--green" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em' }}>
          Everything looks healthy.
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
      {alerts.map((alert, i) => (
        <div key={i} className={`c-alert c-alert--${alert.type === 'alert' ? 'error' : 'warn'}`}>
          <span className={`c-dot c-dot--${alert.type === 'alert' ? 'red' : 'yellow'}`} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em' }}>
            {alert.message}
          </span>
        </div>
      ))}
    </div>
  )
}
