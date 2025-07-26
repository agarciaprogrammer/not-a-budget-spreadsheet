'use client'

import Link from "next/link"
import { useAuth } from './providers/AuthProvider'

export default function UnconventionalNavbar() {
  const { user, signOut } = useAuth()

  return (
    <nav className="fixed left-0 top-0 h-full w-16 flex flex-col items-center justify-between py-6 bg-gradient-to-b from-indigo-600 to-indigo-400 shadow-lg z-50">
      <div className="flex flex-col gap-4 items-center">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow cursor-pointer">
          <span className="font-bold text-indigo-600 text-xl">💸</span>
        </div>
        <Link href="/dashboard" className="w-8 h-8 flex items-center justify-center rounded hover:bg-indigo-200 transition" title="Dashboard">
          <span className="text-lg">📊</span>
        </Link>
      </div>
      <div className="flex flex-col gap-2 items-center">
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-indigo-200 transition" title="Theme toggle" onClick={() => alert('No dark mode for you!')}>🌗</button>
        <Link href="https://github.com/agarciaprogrammer/not-a-budget-spreadsheet" target="_blank" rel="noopener" className="w-8 h-8 flex items-center justify-center rounded hover:bg-indigo-200 transition" title="GitHub">
          <span className="text-lg">🐙</span>
        </Link>
        {user && (
          <button 
            onClick={signOut} 
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-indigo-200 transition cursor-pointer" 
            title="Logout"
          >
            <span className="text-lg">👋</span>
          </button>
        )}
      </div>
    </nav>
  )
}
