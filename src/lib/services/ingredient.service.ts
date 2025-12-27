import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export interface Ingredient {
  id: string
  user_id: string
  name: string
  category: string
  units: number
  unit_weight: number
  weight_unit: 'g' | 'kg' | 'ml' | 'l' | 'unidad'
  storage: 'fridge' | 'freezer' | 'pantry'
  status: 'ok' | 'low' | 'restock'
  created_at: string
}

export interface IngredientFormData {
  name: string
  category: string
  units: number
  unit_weight: number
  weight_unit: 'g' | 'kg' | 'ml' | 'l' | 'unidad'
  storage: 'fridge' | 'freezer' | 'pantry'
  status: 'ok' | 'low' | 'restock'
}

export class IngredientService {
  private getSupabaseClient() {
    if (typeof window === 'undefined') {
      throw new Error('IngredientService must be used in browser environment')
    }
    return createBrowserSupabaseClient()
  }

  async getIngredients(userId: string): Promise<Ingredient[]> {
    const supabase = this.getSupabaseClient()
    const { data, error } = await supabase
      .from('food')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as Ingredient[]) || []
  }

  async createIngredient(userId: string, ingredientData: IngredientFormData): Promise<Ingredient> {
    const supabase = this.getSupabaseClient()
    const { data, error } = await supabase
      .from('food')
      .insert({
        user_id: userId,
        name: ingredientData.name,
        category: ingredientData.category,
        units: Number(ingredientData.units),
        unit_weight: Number(ingredientData.unit_weight),
        weight_unit: ingredientData.weight_unit,
        storage: ingredientData.storage,
        status: ingredientData.status
      })
      .select()
      .single()

    if (error) throw error
    return data as Ingredient
  }

  async deleteIngredient(id: string): Promise<void> {
    const supabase = this.getSupabaseClient()
    const { error } = await supabase
      .from('food')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

export const ingredientService = new IngredientService()
