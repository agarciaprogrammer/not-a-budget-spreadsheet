import { createBrowserSupabaseClient } from './client'

export interface SummaryData {
  totalIncome: number
  totalExpenses: number
  netBalance: number
}

export async function getSummaryData(userId: string): Promise<SummaryData> {
  const supabase = createBrowserSupabaseClient()

  // Obtener el budget_id del usuario
  const { data: budgetUser, error: budgetError } = await supabase
    .from('budget_users')
    .select('budget_id')
    .eq('user_id', userId)
    .eq('role', 'owner')
    .single()

  if (budgetError || !budgetUser) {
    throw new Error('No budget found for user')
  }

  // Consulta optimizada usando SQL agregado para obtener totales
  const { data: summaryResult, error: summaryError } = await supabase
    .from('transactions')
    .select(`
      type,
      amount
    `)
    .eq('budget_id', budgetUser.budget_id)
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