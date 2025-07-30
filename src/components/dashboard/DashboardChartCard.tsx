'use client'

import { ReactNode } from 'react'
import { Card, CardHeader, CardContent } from '@/components/layout/Card'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'

interface DashboardChartCardProps {
  title: string
  subtitle?: string
  loading: boolean
  error: string | null
  isEmpty?: boolean
  emptyMessage?: string
  children: ReactNode
  className?: string
  noPadding?: boolean
  showHeader?: boolean
}

export default function DashboardChartCard({
  title,
  subtitle,
  loading,
  error,
  isEmpty = false,
  emptyMessage = "No data available",
  children,
  className = "",
  noPadding = false,
  showHeader = true
}: DashboardChartCardProps) {
  return (
    <Card className={className} padding={noPadding ? 'none' : 'smx'} shadow="none">
      {showHeader && (
        <CardHeader className={noPadding ? 'px-0 py-2' : ''}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-mg font-semibold text-gray-900">{title}</h3>
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={noPadding ? 'p-0' : ''}>
        {loading ? (
          <LoadingState message="Loading chart data..." className="h-64" />
        ) : error ? (
          <ErrorState 
            title="Error Loading Data"
            message={error}
            className="h-64"
          />
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <span className="text-4xl mb-2">📊</span>
            <p className="text-lg font-medium">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
} 