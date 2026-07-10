'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardHeader, CardContent } from '@/components/layout/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useTranslation } from '@/hooks/useTranslation'
import { Plus, Trash2, ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react'

interface ResourceItem {
  id: string
  amount: string
  type: string
}

export default function AsignacionPage() {
  const { user, loading, error } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()

  // State for dynamic resources
  const [resources, setResources] = useState<ResourceItem[]>([
    { id: '1', amount: '1400000', type: 'salary' } // Default salary resource
  ])

  // State for system historical information (editable mock data)
  const [gastosFijos, setGastosFijos] = useState('230000')
  const [gastosVariables, setGastosVariables] = useState('500000')

  // Validation error states
  const [validationError, setValidationError] = useState<string | null>(null)

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

  const totalResources = resources.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)
  const fixedExpensesVal = parseFloat(gastosFijos) || 0
  const variableExpensesVal = parseFloat(gastosVariables) || 0
  const availableCapital = Math.max(0, totalResources - fixedExpensesVal)

  const resourceTypes = [
    { value: 'salary', label: t('patrimonio.asignacion.type_salary') },
    { value: 'bonus', label: t('patrimonio.asignacion.type_bonus') },
    { value: 'freelance', label: t('patrimonio.asignacion.type_freelance') },
    { value: 'asset_sale', label: t('patrimonio.asignacion.type_asset_sale') },
    { value: 'other', label: t('patrimonio.asignacion.type_other') }
  ]

  const handleAddResource = () => {
    setResources(prev => [
      ...prev,
      { id: Math.random().toString(), amount: '0', type: 'salary' }
    ])
    setValidationError(null)
  }

  const handleRemoveResource = (id: string) => {
    if (resources.length === 1) {
      setValidationError('You must enter at least one resource.')
      return
    }
    setResources(prev => prev.filter(r => r.id !== id))
    setValidationError(null)
  }

  const handleResourceChange = (id: string, field: keyof ResourceItem, value: string) => {
    setResources(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, [field]: value }
      }
      return r
    }))
    setValidationError(null)
  }

  const calculateTotalResources = () => {
    return resources.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)
  }

  const handleConfirm = () => {
    const total = calculateTotalResources()
    
    // Validation 4.1: Invalid income check
    if (total <= 0) {
      setValidationError('Total new resources must be greater than 0.')
      return
    }

    // Validation 5.1: Insufficient/invalid snapshot checks
    if (!gastosFijos || parseFloat(gastosFijos) < 0) {
      setValidationError('Fixed Expenses cannot be negative or empty.')
      return
    }
    if (!gastosVariables || parseFloat(gastosVariables) < 0) {
      setValidationError('Previous Variable Expenses cannot be negative or empty.')
      return
    }

    const fixedExpensesVal = parseFloat(gastosFijos) || 0
    const variableExpensesVal = parseFloat(gastosVariables) || 0
    const availableCapital = Math.max(0, total - fixedExpensesVal)

    // Save inputs to session storage for the results screen
    const allocationData = {
      resources: resources.map(r => ({
        type: resourceTypes.find(opt => opt.value === r.type)?.label || r.type,
        amount: parseFloat(r.amount) || 0
      })),
      totalResources: total,
      gastosFijos: fixedExpensesVal,
      gastosVariables: variableExpensesVal,
      availableCapital: availableCapital
    }

    sessionStorage.setItem('fos_allocation_input', JSON.stringify(allocationData))
    
    // Navigate to results screen
    router.push('/asignacion/resultado')
  }

  return (
    <PageContainer maxWidth="7xl" padding="lg">

      {/* Stepper / Breadcrumbs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <Link href="/patrimonio" className="hover:text-indigo-600 transition flex items-center gap-1">
          <span>🏦 Wealth</span>
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-indigo-600 flex items-center gap-1">
          <span>📝 Wealth Allocation Form</span>
        </span>
        <span className="text-gray-300">/</span>
        <span className="text-gray-400">📊 Proposal</span>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {t('patrimonio.asignacion.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            FOS-001: Enter your new wealth resources and review the historical snapshot for allocation.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => router.push('/patrimonio')}
          className="self-start md:self-auto flex items-center gap-2 border border-gray-200"
        >
          <ArrowLeft size={16} />
          {t('patrimonio.asignacion.back')}
        </Button>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Nuevos Recursos */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-indigo-100 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-50/20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {t('patrimonio.asignacion.resources_title')}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t('patrimonio.asignacion.resources_desc')}
                  </p>
                </div>
                <Button
                  onClick={handleAddResource}
                  variant="primary"
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  <Plus size={16} />
                  {t('patrimonio.asignacion.add_resource')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {resources.map((resource) => (
                <div key={resource.id} className="flex flex-col sm:flex-row gap-4 items-end bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <div className="w-full sm:w-1/3">
                    <Select
                      label={t('patrimonio.asignacion.type')}
                      value={resource.type}
                      onChange={(e) => handleResourceChange(resource.id, 'type', e.target.value)}
                      options={resourceTypes}
                    />
                  </div>
                  <div className="w-full sm:w-2/3 flex gap-3 items-end">
                    <Input
                      label={t('patrimonio.asignacion.amount')}
                      type="number"
                      min="0"
                      value={resource.amount}
                      onChange={(e) => handleResourceChange(resource.id, 'amount', e.target.value)}
                      placeholder="Amount"
                    />
                    <Button
                      variant="danger"
                      onClick={() => handleRemoveResource(resource.id)}
                      className="p-2 min-h-[38px] flex items-center justify-center"
                      title="Delete resource"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Información del Período & Summary */}
        <div className="space-y-6">

          {/* Card: Período Automático */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">
                  {t('patrimonio.asignacion.info_title')}
                </h2>
                <div className="group relative cursor-pointer text-gray-400 hover:text-indigo-600 transition-colors">
                  <HelpCircle size={16} />
                  <span className="absolute bottom-full right-0 w-64 bg-gray-900 text-white text-[11px] p-2.5 rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 normal-case leading-normal">
                    This data is automatically retrieved from your financial tracker. If you detect any incorrect values, you can manually override them before running the wealth allocation.
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('patrimonio.asignacion.info_desc')}
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <Input
                label={t('patrimonio.asignacion.fixed_expenses') + " ($)"}
                type="number"
                min="0"
                value={gastosFijos}
                onChange={(e) => setGastosFijos(e.target.value)}
              />
              <Input
                label={t('patrimonio.asignacion.variable_expenses') + " ($)"}
                type="number"
                min="0"
                value={gastosVariables}
                onChange={(e) => setGastosVariables(e.target.value)}
              />
              <Input
                label={t('patrimonio.asignacion.available_capital') + " ($)"}
                type="text"
                value={availableCapital.toLocaleString('es-AR')}
                readOnly
                disabled
                className="bg-gray-100 font-bold text-gray-700 cursor-not-allowed"
                helperText="Formula: Total New Resources - Fixed Expenses"
              />
            </CardContent>
          </Card>

          {/* Card: Total Summary & Confirm */}
          <Card className="border-indigo-100 bg-indigo-50/20 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                  Wealth Allocation Summary
                </span>
                <div className="flex justify-between items-center py-2 border-b border-indigo-100/50">
                  <span className="text-sm text-gray-600 font-medium">Total New Resources:</span>
                  <span className="text-base font-bold text-gray-900">
                    ${totalResources.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-indigo-100/50">
                  <span className="text-sm text-gray-600 font-medium">Fixed Expenses:</span>
                  <span className="text-base font-bold text-red-600">
                    - ${fixedExpensesVal.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-indigo-100/50 bg-indigo-50/50 px-2 rounded">
                  <span className="text-sm text-indigo-800 font-bold">Available Capital:</span>
                  <span className="text-lg font-extrabold text-indigo-700">
                    ${availableCapital.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 text-xs text-gray-500">
                  <span className="font-medium">Previous Variable Expenses (Reference Only):</span>
                  <span className="font-bold text-gray-700">
                    ${variableExpensesVal.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {validationError && (
                <div className="p-3 bg-red-50 border border-red-150 rounded-lg text-xs font-medium text-red-700">
                  ⚠️ {validationError}
                </div>
              )}

              <Button
                onClick={handleConfirm}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
              >
                <span>{t('patrimonio.asignacion.confirm')}</span>
                <ArrowRight size={16} />
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </PageContainer>
  )
}
