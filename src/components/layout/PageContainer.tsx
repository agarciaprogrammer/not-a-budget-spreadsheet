import { cn } from '@/lib/utils/cn'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function PageContainer({ 
  children, 
  className,
  maxWidth = '7xl',
  padding = 'lg'
}: PageContainerProps) {
  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '7xl': 'max-w-7xl'
  }

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <div className={cn(
      'min-h-screen bg-gray-50',
      paddings[padding],
      className
    )}>
      <div className={cn('mx-auto', maxWidths[maxWidth])}>
        {children}
      </div>
    </div>
  )
} 