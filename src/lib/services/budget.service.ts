import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export interface Budget {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export interface BudgetUser {
  id: string
  budget_id: string
  user_id: string
  role: 'owner' | 'collaborator'
}

export class BudgetService {
  private getSupabaseClient() {
    if (typeof window === 'undefined') {
      throw new Error('BudgetService must be used in browser environment')
    }
    return createBrowserSupabaseClient()
  }

  async getUserBudget(userId: string): Promise<Budget | null> {
    const supabase = this.getSupabaseClient()
    const { data: budgetUser, error } = await supabase
      .from('budget_users')
      .select(`
        budget_id,
        budgets!inner (
          id,
          name,
          owner_id,
          created_at
        )
      `)
      .eq('user_id', userId)
      .eq('role', 'owner')
      .single()

    if (error || !budgetUser) {
      return null
    }
    return budgetUser.budgets as unknown as Budget
  }

  async createDefaultBudget(userId: string): Promise<Budget> {
    const supabase = this.getSupabaseClient()
    const { data: budget, error: budgetError } = await supabase
      .from('budgets')
      .insert({
        name: 'My Budget',
        owner_id: userId,
      })
      .select()
      .single()

    if (budgetError || !budget) {
      throw new Error(`Failed to create budget: ${budgetError?.message}`)
    }

    const { error: budgetUserError } = await supabase
      .from('budget_users')
      .insert({
        budget_id: budget.id,
        user_id: userId,
        role: 'owner',
      })

    if (budgetUserError) {
      await supabase
        .from('budgets')
        .delete()
        .eq('id', budget.id)
      throw new Error(`Failed to create budget access: ${budgetUserError.message}`)
    }
    return budget as Budget
  }

  async hasUserBudget(userId: string): Promise<boolean> {
    const budget = await this.getUserBudget(userId)
    return budget !== null
  }

  async getUserBudgetId(userId: string): Promise<string | null> {
    const supabase = this.getSupabaseClient()
    const { data, error } = await supabase
      .from('budget_users')
      .select('budget_id')
      .eq('user_id', userId)
      .eq('role', 'owner')
      .single()
    if (error || !data) {
      return null
    }
    return data.budget_id
  }
}

export const budgetService = new BudgetService() 