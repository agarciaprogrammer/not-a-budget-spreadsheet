import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { budgetService } from './budget.service'
import { transactionSchema, type TransactionFormData } from '@/validations/transaction'

export interface Transaction {
  id: string
  budget_id: string
  user_id: string
  category_id: string
  type: 'income' | 'expense'
  amount: number
  date: string
  description: string | null
  created_at: string
  categories?: { // Added for join results
    name: string
  }
}

export interface Category {
  id: string
  name: string
}

export class TransactionService {
  private getSupabaseClient() {
    if (typeof window === 'undefined') {
      throw new Error('TransactionService must be used in browser environment')
    }
    return createBrowserSupabaseClient()
  }

  async createTransaction(userId: string, transactionData: Partial<TransactionFormData>): Promise<Transaction> {
    const validatedData = transactionSchema.parse({
      ...transactionData,
      amount: Number(transactionData.amount),
      date: new Date(transactionData.date!).toISOString(),
    })
    const budgetId = await budgetService.getUserBudgetId(userId)
    if (!budgetId) {
      throw new Error('No se encontró el presupuesto del usuario')
    }
    const supabase = this.getSupabaseClient()
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        budget_id: budgetId,
        user_id: userId,
        category_id: validatedData.category_id,
        type: validatedData.type,
        amount: validatedData.amount,
        date: validatedData.date,
        description: validatedData.description || null,
      })
      .select()
      .single()
    if (error) throw error
    return data as Transaction
  }

  async getUserTransactions(userId: string, limit?: number): Promise<Transaction[]> {
    const budgetId = await budgetService.getUserBudgetId(userId)
    if (!budgetId) {
      return []
    }
    const supabase = this.getSupabaseClient()
    let query = supabase
      .from('transactions')
      .select(`
        id,
        budget_id,
        user_id,
        category_id,
        type,
        amount,
        date,
        description,
        created_at,
        categories!inner (
          name
        )
      `)
      .eq('budget_id', budgetId)
      .eq('user_id', userId)
      .order('date', { ascending: false })
    if (limit) {
      query = query.limit(limit)
    }
    const { data, error } = await query
    if (error) throw error
    return data as unknown as Transaction[]
  }

  async deleteTransaction(transactionId: string, userId: string): Promise<void> {
    const supabase = this.getSupabaseClient()
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId)
    if (error) throw error
  }

  async getUserCategories(userId: string): Promise<Category[]> {
    const supabase = this.getSupabaseClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', userId)
      .order('name')
    if (error) throw error
    return data || []
  }

  async getTransactionSummary(userId: string): Promise<{
    totalIncome: number
    totalExpenses: number
    netBalance: number
  }> {
    const budgetId = await budgetService.getUserBudgetId(userId)
    if (!budgetId) {
      return { totalIncome: 0, totalExpenses: 0, netBalance: 0 }
    }
    const supabase = this.getSupabaseClient()
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('budget_id', budgetId)
      .eq('user_id', userId)
    if (error) throw error
    const totalIncome = (transactions || [])
      .filter(t => t.type === 'income')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
    const totalExpenses = (transactions || [])
      .filter(t => t.type === 'expense')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
    const netBalance = totalIncome - totalExpenses
    return {
      totalIncome,
      totalExpenses,
      netBalance
    }
  }
}

export const transactionService = new TransactionService() 