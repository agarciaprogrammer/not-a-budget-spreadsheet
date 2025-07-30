// Re-exportaciones para facilitar imports
export { cn } from './cn'

// Servicios
export { authService } from '@/lib/services/auth.service'
export { budgetService } from '@/lib/services/budget.service'
export { transactionService } from '@/lib/services/transaction.service'
export { profileService } from '@/lib/services/profile.service'
export { budgetApiService } from '@/lib/services/budget-api.service'
export { logger } from '@/lib/services/logging.service'
export { ValidationService } from '@/lib/services/validation.service'

// Tipos
export type { Result } from '@/lib/types/result'
export { success, failure, tryAsync, mapResult, flatMapResult } from '@/lib/types/result'

// Componentes UI
export {
  Button,
  Input,
  Select,
  Modal,
  LoadingState,
  LoadingSpinner,
  ErrorState,
  ErrorAlert,
  EmptyState,
  EmptyTransactions,
  PageContainer,
  Card,
  CardHeader,
  CardContent,
  TransactionForm
} from '@/components/ui'

// Tipos de componentes
export type { 
  TransactionFormData
} from '@/components/ui'
export type { ButtonProps } from '@/components/ui/Button'
export type { InputProps } from '@/components/ui/Input'
export type { SelectProps } from '@/components/ui/Select'
export type { ModalProps } from '@/components/ui/Modal'

// Hooks
export { useAuth } from '@/components/providers/AuthProvider'
export { useAuthentication } from '@/hooks/useAuthentication'
export { useSummaryData } from '@/hooks/useSummaryData'

// Utilitarios de API
export {
  successResponse,
  errorResponse,
  handleResult,
  handleError,
  requireAuth
} from '@/lib/utils/api-response' 