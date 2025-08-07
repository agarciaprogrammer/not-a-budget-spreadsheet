'use client'

import { useMonthlyLimit } from '@/hooks/useMonthlyLimit'
import { Card, CardContent } from '@/components/layout/Card'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatCurrency, getMonthName } from '@/lib/utils/formatters'
import { useTranslation } from '@/hooks/useTranslation'

interface MonthlyLimitCardProps {
  userId: string
  refreshTrigger?: number
}

export default function MonthlyLimitCard({ userId, refreshTrigger }: MonthlyLimitCardProps) {
  const { limit, remaining, percentUsed, isOverLimit, loading, updateLimit, currentMonth } = useMonthlyLimit(userId, refreshTrigger)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newLimit, setNewLimit] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const { t, locale } = useTranslation()

  const handleSetLimit = async () => {
    if (!newLimit || isNaN(Number(newLimit))) return
    
    try {
      setIsUpdating(true)
      await updateLimit(Number(newLimit))
      setIsModalOpen(false)
      setNewLimit('')
    } catch (error) {
      console.error('Failed to update limit:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Don't show if loading
  if (loading) {
    return null
  }

  const statusText = limit 
    ? (isOverLimit
        ? t('dashboard.limit.ignored')
        : t('dashboard.limit.remaining', { amount: formatCurrency(remaining) }))
    : t('dashboard.limit.set.message')

  return (
    <>
      <Card>
        <CardContent className="p-1">
          <div className="flex items-center space-x-6">
            {/* Circular Progress */}
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress circle - only show if limit is set */}
                {limit && (
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={isOverLimit ? "#ef4444" : "#3b82f6"}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentUsed / 100)}`}
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-semibold text-gray-900">
                  {limit ? `${percentUsed.toFixed(0)}%` : '--'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{t('dashboard.monthly.limit')}</h3>
                  <p className="text-sm text-gray-500">
                    {getMonthName(currentMonth.month, locale)} {currentMonth.year}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                >
                  {limit ? t('dashboard.limit.edit') : t('dashboard.limit.set')}
                </Button>
              </div>
              
              {limit && (
                <p className="text-sm text-gray-600 mb-2">
                  {t('dashboard.limit.set.to')} <strong>{formatCurrency(limit)}</strong>
                </p>
              )}
              
              <p className={`text-sm ${isOverLimit ? 'text-red-500 font-medium' : 'text-gray-700'}`}>
                {statusText}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Set/Edit Limit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setNewLimit('')
        }}
        title={limit ? t('dashboard.limit.edit.title') : t('dashboard.limit.set.title')}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard.limit.monthly.spending')}
            </label>
            <Input
              id="limit"
              type="number"
              placeholder={t('dashboard.limit.enter.amount')}
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => {
                setIsModalOpen(false)
                setNewLimit('')
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSetLimit}
              disabled={!newLimit || isNaN(Number(newLimit)) || isUpdating}
            >
              {isUpdating ? t('dashboard.limit.saving') : t('save')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
} 