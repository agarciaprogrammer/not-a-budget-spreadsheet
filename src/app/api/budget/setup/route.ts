import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const adminSupabase = createAdminSupabaseClient()

  try {
    // Obtener el usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar si ya tiene un presupuesto
    const { data: existingBudget } = await supabase
      .from('budget_users')
      .select('budget_id')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .single()

    if (existingBudget) {
      return NextResponse.json({ 
        message: 'User already has a budget',
        budget_id: existingBudget.budget_id 
      })
    }

    // Crear presupuesto por defecto usando el cliente admin
    const { data: budget, error: budgetError } = await adminSupabase
      .from('budgets')
      .insert({
        name: 'My Budget',
        owner_id: user.id,
      })
      .select()
      .single()

    if (budgetError || !budget) {
      return NextResponse.json({ 
        error: `Failed to create budget: ${budgetError?.message}` 
      }, { status: 500 })
    }

    // Crear relación budget_users
    const { error: budgetUserError } = await adminSupabase
      .from('budget_users')
      .insert({
        budget_id: budget.id,
        user_id: user.id,
        role: 'owner',
      })

    if (budgetUserError) {
      // Si falla, limpiar el budget creado
      await adminSupabase
        .from('budgets')
        .delete()
        .eq('id', budget.id)
      
      return NextResponse.json({ 
        error: `Failed to create budget access: ${budgetUserError.message}` 
      }, { status: 500 })
    }

    // Crear categorías por defecto
    const defaultCategories = [
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Bills & Utilities',
      'Healthcare',
      'Travel',
      'Other'
    ]

    const categoryInserts = defaultCategories.map(name => ({
      name,
      user_id: user.id,
    }))

    const { error: categoryError } = await adminSupabase
      .from('categories')
      .insert(categoryInserts)

    if (categoryError) {
      console.warn('Failed to create default categories:', categoryError)
      // No fallamos aquí, las categorías se pueden crear después
    }

    return NextResponse.json({ 
      success: true,
      budget_id: budget.id,
      message: 'Budget setup completed successfully'
    })

  } catch (error) {
    console.error('Budget setup error:', error)
    return NextResponse.json({ 
      error: 'Internal server error during budget setup' 
    }, { status: 500 })
  }
} 