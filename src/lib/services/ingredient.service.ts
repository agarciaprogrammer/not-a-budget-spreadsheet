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
  opened?: boolean
  remaining_level?: 'full' | 'half' | 'low'
  notes?: string
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
  opened?: boolean
  remaining_level?: 'full' | 'half' | 'low'
  notes?: string
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
        unit_weight: ingredientData.weight_unit === 'unidad'
          ? null
          : Number(ingredientData.unit_weight),
        weight_unit: ingredientData.weight_unit,
        storage: ingredientData.storage,
        status: ingredientData.status,
        ...(ingredientData.opened !== undefined ? { opened: ingredientData.opened } : {}),
        ...(ingredientData.remaining_level !== undefined ? { remaining_level: ingredientData.remaining_level } : {}),
        ...(ingredientData.notes !== undefined ? { notes: ingredientData.notes } : {})
      })
      .select()
      .single()

    if (error) throw error
    return data as Ingredient
  }

  async updateIngredient(id: string, ingredientData: IngredientFormData): Promise<Ingredient> {
    const supabase = this.getSupabaseClient()
    const { data, error } = await supabase
      .from('food')
      .update({
        name: ingredientData.name,
        category: ingredientData.category,
        units: Number(ingredientData.units),
        unit_weight: ingredientData.weight_unit === 'unidad'
          ? null
          : Number(ingredientData.unit_weight),
        weight_unit: ingredientData.weight_unit,
        storage: ingredientData.storage,
        status: ingredientData.status,
        opened: ingredientData.opened ?? false,
        remaining_level: ingredientData.remaining_level ?? null,
        notes: ingredientData.notes ?? null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Ingredient
  }

  async consumeIngredient(
    ingredient: Ingredient,
    options?: { amount?: number; remaining_level?: Ingredient['remaining_level'] }
  ): Promise<Ingredient> {
    const supabase = this.getSupabaseClient()
    const isUnit = ingredient.weight_unit === 'unidad'
    const currentUnits = Number(ingredient.units) || 0
    const currentUnitWeight = Number(ingredient.unit_weight) || 0

    const nextUnits = isUnit ? Math.max(0, currentUnits - 1) : currentUnits
    const nextUnitWeight = isUnit
      ? currentUnitWeight
      : Math.max(0, currentUnitWeight - Number(options?.amount || 0))

    const updatePayload: Record<string, unknown> = {
      units: nextUnits
    }

    if (!isUnit) {
      updatePayload.unit_weight = nextUnitWeight
    }

    if (options?.remaining_level !== undefined) {
      updatePayload.remaining_level = options.remaining_level
    }

    const { data, error } = await supabase
      .from('food')
      .update(updatePayload)
      .eq('id', ingredient.id)
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
