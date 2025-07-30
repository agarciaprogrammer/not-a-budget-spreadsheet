'use client'

import { useDashboardDate } from '@/components/providers/DashboardDateProvider'
import { formatMonthForDisplay } from '@/lib/utils/date-utils'
import { Button } from '@/components/ui/Button'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function MonthSelector() {
  const { 
    selectedMonth, 
    goToPreviousMonth, 
    goToNextMonth, 
    goToCurrentMonth 
  } = useDashboardDate()
  
  const isCurrentMonth = selectedMonth.getMonth() === new Date().getMonth() && 
                        selectedMonth.getFullYear() === new Date().getFullYear()
  
  return (
    <div className="flex items-center justify-between bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousMonth}
            className="p-2"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          
          <span className="text-lg font-medium text-gray-900 min-w-[120px] text-center">
            {formatMonthForDisplay(selectedMonth)}
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextMonth}
            className="p-2"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {!isCurrentMonth && (
        <Button
          variant="ghost"
          size="sm"
          onClick={goToCurrentMonth}
          className="text-sm"
        >
          Current Month
        </Button>
      )}
    </div>
  )
} 