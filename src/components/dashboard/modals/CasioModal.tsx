'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface CasioModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  size?: 'md' | 'lg' | 'xl'
}

export default function CasioModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'lg',
}: CasioModalProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const widths = { md: 480, lg: 680, xl: 900 }

  return createPortal(
    <div className="c-modal-overlay">
      <div
        ref={contentRef}
        className="c-modal"
        style={{ maxWidth: widths[size], width: '100%', margin: '0 16px' }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div>
            <div className="c-label" style={{ marginBottom: 4 }}>{title}</div>
            {subtitle && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px 4px',
              fontSize: 18,
              lineHeight: 1,
              transition: 'color 100ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
