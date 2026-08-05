import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { Result, tryAsync } from '@/lib/types/result'
import { LedgerEngine, LedgerSnapshot, LedgerTransaction } from '@/lib/engine/ledger.engine'

export interface Account {
  id: string
  budget_id: string
  name: string
  bank: string
  currency: 'ARS' | 'USD'
  type: 'checking' | 'savings' | 'investment' | 'cash' | 'broker'
  is_active: boolean
  created_at: string
}

export interface AccountBalance extends Account {
  current_balance: number
}

export class AccountService {
  private async getSupabaseClient() {
    if (typeof window !== 'undefined') {
      return createBrowserSupabaseClient()
    }
    try {
      return await createServerSupabaseClient()
    } catch {
      return createAdminSupabaseClient()
    }
  }

  private async getBudgetId(supabase: SupabaseClient, userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('budget_users')
      .select('budget_id')
      .eq('user_id', userId)
      .eq('role', 'owner')
      .single()

    if (error || !data) return null
    return data.budget_id
  }

  /**
   * Obtiene todas las cuentas del presupuesto del usuario
   */
  async getAccounts(userId: string): Promise<Result<Account[]>> {
    return tryAsync(async () => {
      const supabase = await this.getSupabaseClient()
      const budgetId = await this.getBudgetId(supabase, userId)
      if (!budgetId) throw new Error('Budget not found')

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('budget_id', budgetId)
        .eq('is_active', true)
        .order('bank', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      return (data as Account[]) || []
    })
  }

  /**
   * Obtiene los saldos actuales calculados por cuenta desde Ledger Genesis + Transacciones utilizando LedgerEngine
   */
  async getAccountBalances(userId: string): Promise<Result<AccountBalance[]>> {
    return tryAsync(async () => {
      const supabase = await this.getSupabaseClient()
      const budgetId = await this.getBudgetId(supabase, userId)
      if (!budgetId) throw new Error('Budget not found')

      // 1. Fetch active accounts
      const { data: accounts, error: accErr } = await supabase
        .from('accounts')
        .select('*')
        .eq('budget_id', budgetId)
        .eq('is_active', true)

      if (accErr) throw accErr

      // 2. Fetch latest Ledger Genesis
      const { data: snapshots } = await supabase
        .from('ledger_snapshots')
        .select('*, ledger_snapshot_accounts(*)')
        .eq('budget_id', budgetId)
        .order('effective_date', { ascending: false })
        .order('version', { ascending: false })
        .limit(1)

      const genesisSnapshot = (snapshots?.[0] as LedgerSnapshot) || null
      const effectiveDate = genesisSnapshot?.effective_date || '1970-01-01'

      // 3. Fetch transactions from effectiveDate onwards
      const { data: txs, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('budget_id', budgetId)
        .gte('date', effectiveDate)

      if (txErr) throw txErr

      const typedAccounts = (accounts as Account[]) || []
      const typedTxs = (txs as LedgerTransaction[]) || []

      // Delegate calculation to unified LedgerEngine
      const balanceMap = LedgerEngine.calculateAccountBalances(typedAccounts, genesisSnapshot, typedTxs)

      return typedAccounts.map((acc: Account) => ({
        ...acc,
        current_balance: balanceMap.get(acc.id) || 0
      }))
    })
  }

  /**
   * Crea una nueva cuenta
   */
  async createAccount(userId: string, accountData: Omit<Account, 'id' | 'budget_id' | 'created_at' | 'is_active'>): Promise<Result<Account>> {
    return tryAsync(async () => {
      const supabase = await this.getSupabaseClient()
      const budgetId = await this.getBudgetId(supabase, userId)
      if (!budgetId) throw new Error('Budget not found')

      const { data, error } = await supabase
        .from('accounts')
        .insert({
          budget_id: budgetId,
          ...accountData,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error
      return data as Account
    })
  }
}

export const accountService = new AccountService()
