'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'

interface Props {
  isOpen: boolean
  onClose: () => void
  year: number
  month: number
  initialARS: number
  initialUSD: number
  onSaved: () => void
}

export default function EditOpeningBalanceModal({ isOpen, onClose, year, month, initialARS, initialUSD, onSaved }: Props) {
  const [ars, setArs] = useState(String(initialARS ?? 0))
  const [usd, setUsd] = useState(String(initialUSD ?? 0))
  const [saving, setSaving] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    if (isOpen) {
      setArs(String(initialARS ?? 0))
      setUsd(String(initialUSD ?? 0))
    }
  }, [isOpen, initialARS, initialUSD])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/opening-balance-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, ars: Number(ars), usd: Number(usd) })
      })
      onSaved()
      onClose()
    } catch (error) {
      console.error('Failed to save opening balance override', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('dashboard.opening.edit.title') || 'Edit Opening Balance'}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ARS Balance</label>
          <Input type="number" value={ars} onChange={(e) => setArs(e.target.value)} step="0.01" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">USD Balance</label>
          <Input type="number" value={usd} onChange={(e) => setUsd(e.target.value)} step="0.01" />
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="ghost" onClick={onClose}>{t('cancel') || 'Cancel'}</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? (t('save') || 'Saving...') : (t('save') || 'Save')}</Button>
        </div>
      </div>
    </Modal>
  )
}
