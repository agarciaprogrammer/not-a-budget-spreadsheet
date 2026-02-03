import { createBrowserSupabaseClient } from './client'
import { budgetService } from '@/lib/services/budget.service'
import { EXPENSE_KIND_REQUIRED_FROM, EXPENSE_KINDS } from '@/lib/constants'

export interface SummaryData {
  totalIncome: number
  totalFixedExpenses: number
  totalVariableExpenses: number
  totalExpenses: number
  netBalance: number
}

export async function getSummaryData(userId: string): Promise<SummaryData> {
  const supabase = createBrowserSupabaseClient()

  // Usar el servicio de presupuesto en lugar de duplicar lógica
  const budgetId = await budgetService.getUserBudgetId(userId)

  if (!budgetId) {
    throw new Error('No budget found for user')
  }

  // Consulta optimizada usando SQL agregado para obtener totales
  const { data: summaryResult, error: summaryError } = await supabase
    .from('transactions')
    .select(`
      type,
      amount,
      date,
      expense_kind
    `)
    .eq('budget_id', budgetId)
    .eq('user_id', userId)

  if (summaryError) throw summaryError

  // Calcular totales usando los datos filtrados
  const totalIncome = (summaryResult || [])
    .filter(t => t.type === 'income')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
  
  const totalFixedExpenses = (summaryResult || [])
    .filter(t => t.type === 'expense' && t.date >= EXPENSE_KIND_REQUIRED_FROM && t.expense_kind === EXPENSE_KINDS.FIXED)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0)

  const totalVariableExpenses = (summaryResult || [])
    .filter(t => t.type === 'expense' && (t.date < EXPENSE_KIND_REQUIRED_FROM || t.expense_kind === EXPENSE_KINDS.VARIABLE))
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
  
  const totalExpenses = totalFixedExpenses + totalVariableExpenses
  
  const netBalance = totalIncome - totalExpenses

  return {
    totalIncome,
    totalFixedExpenses,
    totalVariableExpenses,
    totalExpenses,
    netBalance
  }
}
