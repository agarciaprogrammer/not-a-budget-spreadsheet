import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { budgetService } from './budget.service'

export interface OpeningBalanceOverride {
  id: string
  budget_id: string
  year: number
  month: number
  ars_amount: number
  usd_amount: number
  created_at: string
  updated_at: string
}

export class OpeningBalanceOverrideService {
  private getSupabaseClient() {
    if (typeof window === 'undefined') {
      throw new Error('OpeningBalanceOverrideService must be used in browser environment')
    }
    return createBrowserSupabaseClient()
  }

  async getOverrideForMonth(userId: string, year: number, month: number): Promise<OpeningBalanceOverride | null> {
    const supabase = this.getSupabaseClient()
    const budgetId = await budgetService.getUserBudgetId(userId)
    if (!budgetId) return null

    const { data, error } = await supabase
      .from('opening_balance_overrides')
      .select('*')
      .eq('budget_id', budgetId)
      .eq('year', year)
      .eq('month', month)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return data ?? null
  }

  async upsertOverride(userId: string, year: number, month: number, ars: number, usd: number): Promise<void> {
    const supabase = this.getSupabaseClient()
    const budgetId = await budgetService.getUserBudgetId(userId)
    if (!budgetId) throw new Error('No budget found for user')

    const { error } = await supabase
      .from('opening_balance_overrides')
      .upsert({
        budget_id: budgetId,
        year,
        month,
        ars_amount: ars,
        usd_amount: usd,
      }, { onConflict: 'budget_id,year,month' })

    if (error) throw error
  }
}

export const openingBalanceOverrideService = new OpeningBalanceOverrideService()
