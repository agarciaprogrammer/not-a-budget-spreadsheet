import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { Result, tryAsync } from '@/lib/types/result'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import { DEFAULT_FIXED_CATEGORIES, DEFAULT_VARIABLE_CATEGORIES, EXPENSE_KINDS } from '@/lib/constants'

export interface BudgetSetupResult {
  budget_id: string
  message: string
}

export class BudgetApiService {
  /**
   * Configura un presupuesto por defecto para un usuario
   */
  async setupDefaultBudget(userId: string): Promise<Result<BudgetSetupResult>> {
    return tryAsync(async () => {
      const adminSupabase = createAdminSupabaseClient()

      // Verificar si ya tiene un presupuesto
      const { data: existingBudget } = await adminSupabase
        .from('budget_users')
        .select('budget_id')
        .eq('user_id', userId)
        .eq('role', 'owner')
        .single()

      if (existingBudget) {
        return {
          budget_id: existingBudget.budget_id,
          message: 'User already has a budget'
        }
      }

      // Crear presupuesto por defecto
      const { data: budget, error: budgetError } = await adminSupabase
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

      // Crear relación budget_users
      const { error: budgetUserError } = await adminSupabase
        .from('budget_users')
        .insert({
          budget_id: budget.id,
          user_id: userId,
          role: 'owner',
        })

      if (budgetUserError) {
        // Limpiar el budget creado si falla la relación
        await adminSupabase
          .from('budgets')
          .delete()
          .eq('id', budget.id)
        
        throw new Error(`Failed to create budget access: ${budgetUserError.message}`)
      }

      // Crear categorías por defecto
      await this.createDefaultCategories(userId, adminSupabase)

      return {
        budget_id: budget.id,
        message: 'Budget setup completed successfully'
      }
    })
  }

  /**
   * Crea categorías por defecto para un usuario
   */
  private async createDefaultCategories(userId: string, adminSupabase: SupabaseClient): Promise<void> {
    const categoryInserts = [
      ...DEFAULT_FIXED_CATEGORIES.map(name => ({
        name,
        user_id: userId,
        expense_kind: EXPENSE_KINDS.FIXED,
      })),
      ...DEFAULT_VARIABLE_CATEGORIES.map(name => ({
        name,
        user_id: userId,
        expense_kind: EXPENSE_KINDS.VARIABLE,
      })),
    ]

    const { error: categoryError } = await adminSupabase
      .from('categories')
      .insert(categoryInserts)

    if (categoryError) {
      console.warn('Failed to create default categories:', categoryError)
      // No fallamos aquí, las categorías se pueden crear después
    }
  }

  /**
   * Obtiene el usuario autenticado actual
   */
  async getCurrentUser(): Promise<Result<User>> {
    return tryAsync(async () => {
      const supabase = await createServerSupabaseClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        throw new Error(`Failed to get current user: ${error.message}`)
      }

      if (!user) {
        throw new Error('No authenticated user found')
      }

      return user
    })
  }
}

// Instancia singleton del servicio
export const budgetApiService = new BudgetApiService() 
