'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from './providers/AuthProvider'
import { useTranslation } from '@/hooks/useTranslation'
import { LanguageDropdown } from './ui/LanguageDropdown'

const CommonLinks = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  
  return (
    <>
      <Link 
        href="/dashboard"
        className="flex items-center gap-3 px-4 py-2 rounded hover:bg-indigo-200 transition"
        onClick={onClose}
      >
        <span className="text-lg">📊</span>
        <span className="md:hidden">{t('nav.dashboard')}</span>
      </Link>
      {user && (
        <button
          onClick={() => { 
            signOut()
            onClose()
          }}
          className="flex items-center gap-3 px-4 py-2 rounded hover:bg-indigo-200 transition cursor-pointer"
        >
          <span className="text-lg">👋</span>
          <span className="md:hidden">{t('logout')}</span>
        </button>
      )}
    </>
  )
}

export default function UnconventionalNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* 🌐 language selector (siempre visible) */}
      <div className="fixed top-0 right-0 p-4 z-50">
        <LanguageDropdown />
      </div>

      {/* ===== Desktop sidebar ===== */}
      <nav className="hidden md:fixed md:left-0 md:top-0 md:h-full md:w-16 md:flex md:flex-col md:items-center md:justify-between md:py-6 bg-gradient-to-b from-indigo-600 to-indigo-400 shadow-lg z-40">
        <div className="flex flex-col gap-4 items-center">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow">
            <span className="font-bold text-indigo-600 text-xl">💸</span>
          </div>
          <CommonLinks onClose={() => {}} />
        </div>
      </nav>

      {/* ===== Mobile top bar ===== */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-12 flex items-center justify-between px-4 bg-indigo-600 text-white shadow z-50">
        <button
          aria-label="Toggle menu"
          className="text-2xl"
          onClick={() => setOpen(!open)}
        >
          {open ? '✖️' : '🍔'}
        </button>
        <span className="font-bold">💸</span>
      </header>

      {/* ===== Mobile drawer ===== */}
      <aside 
        className={`md:hidden fixed inset-y-0 left-0 w-64 bg-indigo-50 pt-16 shadow-lg transform transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <CommonLinks onClose={() => setOpen(false)} />
      </aside>
    </>
  )
}
