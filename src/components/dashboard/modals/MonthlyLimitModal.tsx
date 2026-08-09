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
  const { limit, spent, debitSpent, creditSpent, remaining, percentUsed, isOverLimit, loading, updateLimit, currentMonth } = useMonthlyLimit(userId, refreshTrigger)
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
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>of limit consumed</span>
              </div>

              <div className="c-progress-track" style={{ height: 6, marginBottom: 20 }}>
                <div
                  className="c-progress-fill"
                  style={{ width: `${Math.min(percentUsed, 100)}%`, background: barColor }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <StatRow label="Monthly Limit" value={formatCurrency(limit, 'ARS')} />
                
                {/* Breakdown subsection */}
                <div style={{
                  margin: '8px 0',
                  padding: '10px 12px',
                  background: 'rgba(255, 255, 255, 0.015)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <div className="c-label" style={{ fontSize: 9, letterSpacing: '0.08em', marginBottom: 2 }}>
                    CONSUMED THIS MONTH (SPENT)
                  </div>
                  <SubStatRow label="· Efectivo" value={formatCurrency(debitSpent, 'ARS')} />
                  <SubStatRow label="· Crédito" value={formatCurrency(creditSpent, 'ARS')} color="#d8b4fe" />
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 6, marginTop: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      Total Consumido
                    </span>
                    <span className="c-value" style={{ fontSize: 13, fontWeight: 700, color: isOverLimit ? 'var(--red-alert)' : 'var(--text-primary)' }}>
                      {formatCurrency(spent, 'ARS')}
                    </span>
                  </div>
                </div>

                <StatRow
                  label={isOverLimit ? 'Over Limit' : 'Remaining Available'}
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

function SubStatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{label}</span>
      <span className="c-value" style={{ fontSize: 11, fontWeight: 500, color: color ?? 'var(--text-secondary)' }}>{value}</span>
    </div>
  )
}
