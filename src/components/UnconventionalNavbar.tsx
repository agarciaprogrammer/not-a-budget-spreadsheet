'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './providers/AuthProvider'

// Icon set — minimalist SVGs matching Casio aesthetic
function IconHome({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12L12 3l9 9" /><path d="M9 21V12h6v9" /><path d="M3 12v9h18v-9" />
    </svg>
  )
}

function IconPatrimonio({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 12h6M9 15h4" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export default function UnconventionalNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const links = [
    { href: '/dashboard', label: 'Home', Icon: IconHome },
    { href: '/patrimonio', label: 'Patrimonio', Icon: IconPatrimonio },
  ]

  return (
    <>
      {/* ─── Desktop sidebar ──────────────────────────────────────── */}
      <nav
        className="c-nav hidden md:flex md:fixed md:left-0 md:top-0 md:h-full md:w-14 md:flex-col md:items-center md:py-5 md:gap-1 z-40"
        style={{ borderRight: '1px solid var(--border-subtle)' }}
      >
        {/* Logo mark */}
        <div
          className="w-8 h-8 flex items-center justify-center mb-4 rounded"
          style={{ color: 'var(--casio-blue)', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '-0.04em' }}
          title="Not a Budget Spreadsheet"
        >
          FOS
        </div>

        {/* Nav links */}
        <div className="flex flex-col gap-1 flex-1">
          {links.map(({ href, label, Icon }) => {
            const active = pathname?.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`c-nav-link ${active ? 'active' : ''}`}
              >
                <Icon active={active} />
              </Link>
            )
          })}
        </div>

        {/* Sign out */}
        {user && (
          <button
            onClick={signOut}
            title="Sign out"
            className="c-nav-link"
            style={{ marginTop: 'auto' }}
          >
            <IconLogout />
          </button>
        )}
      </nav>

      {/* ─── Mobile top bar ───────────────────────────────────────── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 h-11 flex items-center justify-between px-4 z-50"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <span style={{ color: 'var(--casio-blue)', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>
          FOS
        </span>
        <button
          aria-label="Toggle menu"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ color: 'var(--text-secondary)', padding: '4px' }}
        >
          {mobileOpen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          )}
        </button>
      </header>

      {/* ─── Mobile drawer ────────────────────────────────────────── */}
      {mobileOpen && (
        <aside
          className="md:hidden fixed inset-y-0 left-0 w-52 pt-11 z-40 flex flex-col"
          style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)' }}
        >
          <div className="flex flex-col gap-1 p-3">
            {links.map(({ href, label, Icon }) => {
              const active = pathname?.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${active ? 'active' : ''}`}
                  style={{
                    color: active ? 'var(--casio-blue)' : 'var(--text-secondary)',
                    background: active ? 'var(--casio-blue-glow)' : 'transparent'
                  }}
                >
                  <Icon active={active} />
                  {label}
                </Link>
              )
            })}
          </div>

          {user && (
            <div className="mt-auto p-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                onClick={() => { signOut(); setMobileOpen(false) }}
                className="flex items-center gap-3 px-3 py-2 rounded text-sm w-full transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <IconLogout />
                Sign out
              </button>
            </div>
          )}
        </aside>
      )}
    </>
  )
}
