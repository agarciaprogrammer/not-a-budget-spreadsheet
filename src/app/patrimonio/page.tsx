'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card } from '@/components/layout/Card'
import { useTranslation } from '@/hooks/useTranslation'
import Link from 'next/link'
import { ArrowRight, BarChart3, PieChart, TrendingUp, Target, Coins } from 'lucide-react'

export default function PatrimonioPage() {
  const { user, loading, error } = useAuth()
  const { t } = useTranslation()

  if (loading) {
    return <LoadingState message={t('loading')} className="min-h-screen" />
  }

  if (error) {
    return (
      <ErrorState 
        title={t('error')}
        message={error}
        className="min-h-screen"
      />
    )
  }

  if (!user) {
    return (
      <ErrorState 
        title={t('dashboard.access.denied.title')}
        message={t('dashboard.access.denied.message')}
        className="min-h-screen"
      />
    )
  }

  return (
    <PageContainer maxWidth="7xl" padding="lg">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shadow-sm">
            <span className="text-2xl">🏦</span>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {t('patrimonio.title')}
            </h1>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
              {t('patrimonio.subtitle')}
            </p>
          </div>
        </div>
        <p className="text-gray-500 mt-2 max-w-2xl">
          Manage your financial assets through predefined rules of the Financial Operating System, automating decisions and optimizing your long-term net worth.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Main Card (significantly larger - full width) */}
        <Link 
          href="/dashboard" 
          className="col-span-1 md:col-span-2 lg:col-span-4 block group"
        >
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white rounded-2xl border border-indigo-500 shadow-md p-8 md:p-10 transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Background decoration */}
            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12 transition-transform duration-500 group-hover:scale-110">
              <BarChart3 size={240} />
            </div>
            
            <div className="space-y-4 max-w-xl relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-100 border border-indigo-400/20">
                📊 {t('nav.dashboard')}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {t('patrimonio.main_card_title')}
              </h2>
              <p className="text-indigo-100/90 text-sm md:text-base leading-relaxed">
                {t('patrimonio.main_card_desc')}
              </p>
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              <span className="font-semibold text-sm group-hover:underline decoration-2 underline-offset-4">
                Go to Dashboard
              </span>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <ArrowRight size={20} className="text-white" />
              </div>
            </div>
          </div>
        </Link>

        {/* Card 1: Distribución Patrimonial (Placeholder) */}
        <Card className="flex flex-col justify-between border-gray-200 bg-gray-50/50 relative overflow-hidden group">
          <div className="absolute top-3 right-3">
            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-gray-200 text-gray-500 rounded">
              {t('patrimonio.coming_soon')}
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-gray-200/60 flex items-center justify-center">
              <PieChart size={20} className="text-gray-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">
                {t('patrimonio.modules.distribucion.title')}
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {t('patrimonio.modules.distribucion.desc')}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-gray-400">
            <span>View Details</span>
            <ArrowRight size={14} />
          </div>
        </Card>

        {/* Card 2: Evolución Patrimonial (Placeholder) */}
        <Card className="flex flex-col justify-between border-gray-200 bg-gray-50/50 relative overflow-hidden group">
          <div className="absolute top-3 right-3">
            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-gray-200 text-gray-500 rounded">
              {t('patrimonio.coming_soon')}
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-gray-200/60 flex items-center justify-center">
              <TrendingUp size={20} className="text-gray-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">
                {t('patrimonio.modules.evolucion.title')}
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {t('patrimonio.modules.evolucion.desc')}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-gray-400">
            <span>View Details</span>
            <ArrowRight size={14} />
          </div>
        </Card>

        {/* Card 3: Objetivos Patrimoniales (Placeholder) */}
        <Card className="flex flex-col justify-between border-gray-200 bg-gray-50/50 relative overflow-hidden group">
          <div className="absolute top-3 right-3">
            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-gray-200 text-gray-500 rounded">
              {t('patrimonio.coming_soon')}
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-gray-200/60 flex items-center justify-center">
              <Target size={20} className="text-gray-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">
                {t('patrimonio.modules.objetivos.title')}
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {t('patrimonio.modules.objetivos.desc')}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-gray-400">
            <span>View Details</span>
            <ArrowRight size={14} />
          </div>
        </Card>

        {/* Card 4: Asignación Mensual (Active) */}
        <Link href="/asignacion" className="block">
          <Card className="h-full flex flex-col justify-between border-indigo-200 bg-white shadow-sm hover:shadow-md hover:border-indigo-400 hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
            <div className="absolute top-3 right-3">
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-green-100 text-green-700 rounded-full border border-green-200 animate-pulse">
                {t('patrimonio.active') || 'Enter'}
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-300">
                <Coins size={20} className="text-indigo-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {t('patrimonio.modules.asignacion.title')}
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {t('patrimonio.modules.asignacion.desc')}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
              <span>Start Process</span>
              <ArrowRight size={14} />
            </div>
          </Card>
        </Link>

      </div>
    </PageContainer>
  )
}
