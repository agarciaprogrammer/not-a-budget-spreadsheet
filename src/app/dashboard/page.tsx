'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { ErrorState } from '@/components/ui/ErrorState'
import { DashboardDateProvider } from '@/components/providers/DashboardDateProvider'
import AddTransactionModal from '@/components/transactions/AddTransactionModal'
import AddCommitmentModal from '@/components/transactions/AddCommitmentModal'

import HomeScreen from '@/components/dashboard/home/HomeScreen'
import WorkspaceSection from '@/components/dashboard/workspace/WorkspaceSection'

import NetWorthModal from '@/components/dashboard/modals/NetWorthModal'
import CommitmentsModal from '@/components/dashboard/modals/CommitmentsModal'
import SpendingModal from '@/components/dashboard/modals/SpendingModal'
import MonthlyLimitModal from '@/components/dashboard/modals/MonthlyLimitModal'

export type ModalType = 'networth' | 'commitments' | 'spending' | 'limit' | null

export default function DashboardPage() {
  const { user, loading, error } = useAuth()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false)

  const refresh = useCallback(() => setRefreshTrigger(p => p + 1), [])

  // Sidebar contextual: home mode = sidebar oculto, workspace = visible
  useEffect(() => {
    // Modo inicial: Home
    document.body.dataset.mode = 'home'

    const el = document.getElementById('workspace')
    if (!el) return

    const obs = new IntersectionObserver(
      ([entry]) => {
        document.body.dataset.mode = entry.isIntersecting ? 'workspace' : 'home'
      },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => {
      obs.disconnect()
      // Limpiar al desmontar para no afectar otras páginas
      delete document.body.dataset.mode
    }
  }, [])

  useEffect(() => {
    const handler = () => refresh()
    window.addEventListener('openingBalanceOverride:changed', handler)
    return () => window.removeEventListener('openingBalanceOverride:changed', handler)
  }, [refresh])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: 8 }}>
            LOADING
          </div>
          <div style={{ width: 120, height: 2, background: 'var(--border-subtle)', borderRadius: 1, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--casio-blue)', borderRadius: 1, animation: 'loadbar 1.2s ease infinite' }} />
          </div>
          <style>{`@keyframes loadbar { 0% { width: 0%; margin-left: 0 } 50% { width: 70%; } 100% { width: 0%; margin-left: 100% } }`}</style>
        </div>
      </div>
    )
  }

  if (error) return <ErrorState title="Authentication Error" message={error} className="min-h-screen" />
  if (!user) return <ErrorState title="Access Denied" message="Please sign in to access the dashboard." className="min-h-screen" />

  return (
    <DashboardDateProvider>
      <div
        style={{
          background: 'var(--bg-base)',
          height: '100vh',
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
        }}
      >
        {/* ── HOME — Status Screen (full viewport, snap start) ─── */}
        <section style={{ scrollSnapAlign: 'start', height: '100vh', overflow: 'hidden' }}>
          <HomeScreen
            user={user}
            refreshTrigger={refreshTrigger}
            onOpenNetWorth={() => setActiveModal('networth')}
            onAddTransaction={() => setIsTransactionModalOpen(true)}
            onAddCommitment={() => setIsCommitmentModalOpen(true)}
          />
        </section>

        {/* ── WORKSPACE — Tool mode (snap start) ──────────────── */}
        <section style={{ scrollSnapAlign: 'start', minHeight: '100vh' }}>
          <WorkspaceSection
            refreshTrigger={refreshTrigger}
            onAddTransaction={() => setIsTransactionModalOpen(true)}
            onRefresh={refresh}
            onOpenNetWorth={() => setActiveModal('networth')}
            onOpenCommitments={() => setActiveModal('commitments')}
            onOpenLimit={() => setActiveModal('limit')}
          />
        </section>
      </div>

      {/* ── Modales de detalle ────────────────────────────────── */}
      <NetWorthModal
        isOpen={activeModal === 'networth'}
        onClose={() => setActiveModal(null)}
        refreshTrigger={refreshTrigger}
        onSaved={refresh}
      />
      <CommitmentsModal
        isOpen={activeModal === 'commitments'}
        onClose={() => setActiveModal(null)}
        refreshTrigger={refreshTrigger}
        onRefresh={refresh}
      />
      <SpendingModal
        isOpen={activeModal === 'spending'}
        onClose={() => setActiveModal(null)}
        refreshTrigger={refreshTrigger}
      />
      <MonthlyLimitModal
        isOpen={activeModal === 'limit'}
        onClose={() => setActiveModal(null)}
        userId={user.id}
        refreshTrigger={refreshTrigger}
      />

      {/* ── Modales de formulario ─────────────────────────────── */}
      <AddTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onTransactionAdded={refresh}
      />
      <AddCommitmentModal
        isOpen={isCommitmentModalOpen}
        onClose={() => setIsCommitmentModalOpen(false)}
        onCommitmentAdded={refresh}
      />
    </DashboardDateProvider>
  )
}
