import { createBrowserSupabaseClient } from './client'
import { budgetService } from '@/lib/services/budget.service'

export interface SummaryData {
  totalIncome: number
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
      amount
    `)
    .eq('budget_id', budgetId)
    .eq('user_id', userId)

  if (summaryError) throw summaryError

  // Calcular totales usando los datos filtrados
  const totalIncome = (summaryResult || [])
    .filter(t => t.type === 'income')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
  
  const totalExpenses = (summaryResult || [])
    .filter(t => t.type === 'expense')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
  
  const netBalance = totalIncome - totalExpenses

  return {
    totalIncome,
    totalExpenses,
    netBalance
  }
} 