'use client'

import { useDashboardDate } from '@/components/providers/DashboardDateProvider'
import type { User } from '@supabase/supabase-js'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatMonthFull(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

interface HomeHeaderProps {
  user: User
}

export default function HomeHeader({ user }: HomeHeaderProps) {
  const { selectedMonth, goToPreviousMonth, goToNextMonth, goToCurrentMonth } = useDashboardDate()

  const isCurrentMonth =
    selectedMonth.getMonth() === new Date().getMonth() &&
    selectedMonth.getFullYear() === new Date().getFullYear()

  const displayName = user.user_metadata?.full_name?.split(' ')[0]
    ?? user.email?.split('@')[0]
    ?? 'there'

  return (
    <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
      {/* Left: greeting */}
      <div>
        <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
          {getGreeting()}
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
          {displayName}
          <span style={{ color: 'var(--casio-blue)', marginLeft: 2 }}>.</span>
        </h1>
      </div>

      {/* Right: month selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          className="c-month-btn"
          onClick={goToPreviousMonth}
          aria-label="Previous month"
        >
          ‹
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 130 }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: isCurrentMonth ? 'var(--casio-blue)' : 'var(--text-primary)',
          }}>
            {formatMonthFull(selectedMonth).toUpperCase()}
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
                marginTop: 2,
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
        >
          ›
        </button>
      </div>
    </div>
  )
}
