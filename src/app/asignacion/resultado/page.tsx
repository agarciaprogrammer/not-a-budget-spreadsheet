'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardHeader, CardContent } from '@/components/layout/Card'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'
import Link from 'next/link'
import { ArrowLeft, Check, RefreshCw, Layers, DollarSign, Wallet, ShieldAlert, TrendingUp, BarChart2, Coins } from 'lucide-react'

interface ResourceSummary {
  type: string
  amount: number
}

interface AllocationInput {
  resources: ResourceSummary[]
  totalResources: number
  gastosFijos: number
  gastosVariables: number
  capitalDisponible: number
}

export default function ResultadoAsignacionPage() {
  const { user, loading, error } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  
  const [inputData, setInputData] = useState<AllocationInput | null>(null)
  const [successToast, setSuccessToast] = useState(false)

  useEffect(() => {
    // Retrieve data from sessionStorage
    const saved = sessionStorage.getItem('fos_allocation_input')
    if (saved) {
      try {
        setInputData(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse saved allocation input data:', e)
      }
    } else {
      // Default mock data if accessed directly
      setInputData({
        resources: [
          { type: t('patrimonio.asignacion.type_salary') || 'Salario', amount: 2500000 },
          { type: t('patrimonio.asignacion.type_freelance') || 'Freelance', amount: 500000 }
        ],
        totalResources: 3000000,
        gastosFijos: 1200000,
        gastosVariables: 600000,
        capitalDisponible: 1200000
      })
    }
  }, [t])

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

  if (!inputData) {
    return <LoadingState message="Cargando propuesta..." className="min-h-screen" />
  }

  const capital = inputData.capitalDisponible

  // Mock distribution percentages for layers (total 100%)
  const layerRatios = [
    { key: 'layer1', pct: 0.20, icon: Wallet, color: 'from-emerald-500 to-teal-600', border: 'border-emerald-200', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    { key: 'layer2', pct: 0.25, icon: ShieldAlert, color: 'from-blue-500 to-indigo-600', border: 'border-blue-200', text: 'text-blue-700', bg: 'bg-blue-50' },
    { key: 'layer3', pct: 0.15, icon: Layers, color: 'from-indigo-500 to-purple-600', border: 'border-indigo-200', text: 'text-indigo-700', bg: 'bg-indigo-50' },
    { key: 'layer4', pct: 0.15, icon: TrendingUp, color: 'from-purple-500 to-pink-600', border: 'border-purple-200', text: 'text-purple-700', bg: 'bg-purple-50' },
    { key: 'layer5', pct: 0.15, icon: BarChart2, color: 'from-pink-500 to-rose-600', border: 'border-pink-200', text: 'text-rose-700', bg: 'bg-rose-50' },
    { key: 'layer6', pct: 0.10, icon: Coins, color: 'from-amber-500 to-orange-600', border: 'border-amber-200', text: 'text-amber-700', bg: 'bg-amber-50' }
  ]

  const layersInfo = layerRatios.map((item, idx) => {
    const num = idx + 1
    const amount = capital * item.pct
    return {
      ...item,
      number: num,
      name: t(`patrimonio.asignacion.layer${num}_name`) || `Capa ${num}`,
      desc: t(`patrimonio.asignacion.layer${num}_desc`) || `Misión de la Capa ${num}`,
      amount
    }
  })

  const handleApply = () => {
    setSuccessToast(true)
    setTimeout(() => {
      setSuccessToast(false)
      sessionStorage.removeItem('fos_allocation_input')
      router.push('/patrimonio')
    }, 2500)
  }

  return (
    <PageContainer maxWidth="7xl" padding="lg">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce flex items-center gap-3 bg-green-600 text-white px-5 py-4 rounded-xl shadow-2xl border border-green-500">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Check size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">¡Asignación Aplicada!</p>
            <p className="text-xs text-green-100">Los saldos simulados se guardaron correctamente.</p>
          </div>
        </div>
      )}

      {/* Stepper / Breadcrumbs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <Link href="/patrimonio" className="hover:text-indigo-600 transition flex items-center gap-1">
          <span>🏦 Patrimonio</span>
        </Link>
        <span className="text-gray-300">/</span>
        <Link href="/asignacion" className="hover:text-indigo-600 transition flex items-center gap-1">
          <span>📝 Formulario</span>
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-indigo-600 flex items-center gap-1">
          <span>📊 Propuesta de Asignación</span>
        </span>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {t('patrimonio.asignacion.result_title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('patrimonio.asignacion.result_desc')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            onClick={() => router.push('/asignacion')}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Reajustar Valores
          </Button>
          <Button 
            onClick={handleApply}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2"
          >
            <Check size={16} />
            Aplicar Propuesta
          </Button>
        </div>
      </div>

      {/* Grid: Inputs Summary & Proposal Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Summary of entered values */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-gray-200 bg-gray-50/50 shadow-sm sticky top-6">
            <CardHeader className="border-b border-gray-200">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Datos Ingresados
              </h2>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-sm">
              <div>
                <span className="text-xs font-semibold text-gray-400 block uppercase">Nuevos Ingresos</span>
                <div className="mt-1 space-y-1 max-h-36 overflow-y-auto pr-1">
                  {inputData.resources.map((res, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-gray-150 text-xs">
                      <span className="font-medium text-gray-700">{res.type}</span>
                      <span className="font-bold text-gray-900">${res.amount.toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200/60 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Ingresos Totales:</span>
                  <span className="font-bold text-gray-800">${inputData.totalResources.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Gastos Fijos:</span>
                  <span className="font-bold text-gray-800">${inputData.gastosFijos.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Gastos Variables:</span>
                  <span className="font-bold text-gray-800">${inputData.gastosVariables.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex flex-col items-center justify-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Capital Asignable</span>
                <span className="text-2xl font-black text-indigo-900 mt-1">
                  ${capital.toLocaleString('es-AR')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Visual layers of capital distribution */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Header for Layers */}
          <div className="bg-indigo-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-800 text-indigo-200 border border-indigo-700">
                ℹ️ Principio FOS
              </span>
              <h2 className="text-lg font-bold">
                Crecimiento progresivo en cascada
              </h2>
              <p className="text-xs text-indigo-200 max-w-xl">
                El capital fluye secuencialmente de la Capa 1 a la Capa 6. El sistema sugiere llenar las primeras capas antes de destinar fondos a las más especulativas.
              </p>
            </div>
            <div className="flex items-center gap-1 text-2xl font-bold bg-white/10 px-4 py-2 rounded-xl">
              <span>{layersInfo.length}</span>
              <span className="text-sm font-semibold text-indigo-200">Capas de Capital</span>
            </div>
          </div>

          {/* Grid of Capas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {layersInfo.map((layer) => {
              const IconComp = layer.icon
              return (
                <Card 
                  key={layer.key} 
                  className={`flex flex-col justify-between border-2 ${layer.border} shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01]`}
                >
                  <CardHeader className={`${layer.bg} border-b border-gray-150`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${layer.color} text-white flex items-center justify-center shadow-sm`}>
                          <IconComp size={16} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900">
                          {layer.name}
                        </h3>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${layer.bg} ${layer.text} border border-current`}>
                        {(layer.pct * 100)}%
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {layer.desc}
                    </p>
                    
                    {/* Amount & Progress bar */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-gray-400 font-semibold">Monto Sugerido:</span>
                        <span className={`text-xl font-extrabold ${layer.text}`}>
                          ${layer.amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${layer.color}`} 
                          style={{ width: `${layer.pct * 100}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 flex justify-between items-center">
            <Link 
              href="/asignacion"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 transition"
            >
              <ArrowLeft size={16} />
              Volver al Formulario
            </Link>
            
            <Button 
              onClick={handleApply}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-lg shadow-md flex items-center gap-2 transition"
            >
              <Check size={16} />
              Confirmar y Aplicar Asignación
            </Button>
          </div>

        </div>
      </div>
    </PageContainer>
  )
}
