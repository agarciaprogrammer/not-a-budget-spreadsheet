'use client'

import { useState } from 'react'
import CasioModal from './CasioModal'
import { useMonthlyLimit } from '@/hooks/useMonthlyLimit'
import { formatCurrency } from '@/lib/utils/formatters'

interface MonthlyLimitModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  refreshTrigger: number
}

export default function MonthlyLimitModal({ isOpen, onClose, userId, refreshTrigger }: MonthlyLimitModalProps) {
  const { limit, spent, remaining, percentUsed, isOverLimit, loading, updateLimit, currentMonth } = useMonthlyLimit(userId, refreshTrigger)
  const [newLimit, setNewLimit] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const val = Number(newLimit)
    if (!newLimit || isNaN(val) || val <= 0) return
    setSaving(true)
    try {
      await updateLimit(val)
      setNewLimit('')
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const barColor = isOverLimit ? 'var(--red-alert)' : percentUsed > 75 ? 'var(--yellow-warn)' : 'var(--casio-blue)'

  return (
    <CasioModal
      isOpen={isOpen}
      onClose={onClose}
      title="Monthly Spending Limit"
      subtitle={`${currentMonth.year > 0 ? `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}` : ''}`}
      size="md"
    >
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 28, background: 'var(--border-subtle)', borderRadius: 3, opacity: 0.5 - i * 0.1 }} />
          ))}
        </div>
      ) : (
        <>
          {/* Status display */}
          {limit ? (
            <div style={{ marginBottom: 24 }}>
              {/* Big progress */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <span className="c-value" style={{ fontSize: 32, fontWeight: 700, color: barColor }}>
                  {percentUsed.toFixed(0)}%
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>of limit used</span>
              </div>

              <div className="c-progress-track" style={{ height: 6, marginBottom: 20 }}>
                <div
                  className="c-progress-fill"
                  style={{ width: `${Math.min(percentUsed, 100)}%`, background: barColor }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <StatRow label="Monthly limit" value={formatCurrency(limit, 'ARS')} />
                <StatRow label="Spent so far" value={formatCurrency(spent, 'ARS')} color={isOverLimit ? 'var(--red-alert)' : 'var(--text-primary)'} />
                <StatRow
                  label={isOverLimit ? 'Over limit' : 'Remaining'}
                  value={formatCurrency(Math.abs(remaining), 'ARS')}
                  color={isOverLimit ? 'var(--red-alert)' : 'var(--green-lcd)'}
                />
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 24, padding: '16px 0', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
              NO LIMIT SET FOR THIS MONTH
            </div>
          )}

          {/* Edit form */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
            <div className="c-label" style={{ marginBottom: 10 }}>
              {limit ? 'Update Limit' : 'Set Limit'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="c-input"
                type="number"
                placeholder="Enter ARS amount"
                value={newLimit}
                onChange={e => setNewLimit(e.target.value)}
                min="0"
                step="1000"
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              />
              <button
                className="c-btn c-btn--primary"
                onClick={handleSave}
                disabled={!newLimit || isNaN(Number(newLimit)) || saving}
                style={{ flexShrink: 0 }}
              >
                {saving ? '...' : 'Save'}
              </button>
            </div>
          </div>
        </>
      )}
    </CasioModal>
  )
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
      <span className="c-value" style={{ fontSize: 13, fontWeight: 600, color: color ?? 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}
