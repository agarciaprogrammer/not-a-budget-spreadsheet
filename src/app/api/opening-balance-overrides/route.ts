import { NextRequest, NextResponse } from 'next/server'
import { profileService } from '@/lib/services/profile.service'
import { handleError, successResponse } from '@/lib/utils/api-response'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userResult = await profileService.getCurrentUser()
    if (!userResult.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const year = Number(url.searchParams.get('year'))
    const month = Number(url.searchParams.get('month'))

    if (!year || !month) {
      return NextResponse.json({ error: 'Missing year or month' }, { status: 400 })
    }

    const admin = createAdminSupabaseClient()

    // Resolve budget_id for the current user (owner)
    const { data: budgetUser, error: buError } = await admin
      .from('budget_users')
      .select('budget_id')
      .eq('user_id', userResult.data.id)
      .eq('role', 'owner')
      .single()

    if (buError) throw buError

    const budgetId = budgetUser?.budget_id
    if (!budgetId) return successResponse({ override: null })

    const { data, error } = await admin
      .from('opening_balance_overrides')
      .select('*')
      .eq('budget_id', budgetId)
      .eq('year', year)
      .eq('month', month)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return successResponse({ override: data ?? null })
  } catch (error) {
    return handleError(error, 'Failed to get opening balance override')
  }
}

export async function POST(request: NextRequest) {
  try {
    const userResult = await profileService.getCurrentUser()
    if (!userResult.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { year, month, ars, usd } = body

    if (typeof year !== 'number' || typeof month !== 'number') {
      return NextResponse.json({ error: 'Missing year or month' }, { status: 400 })
    }

    const admin = createAdminSupabaseClient()

    // Need to resolve budget_id for the user
    const { data: budgetUser, error: buError } = await admin
      .from('budget_users')
      .select('budget_id')
      .eq('user_id', userResult.data.id)
      .eq('role', 'owner')
      .single()

    if (buError) throw buError

    const budgetId = budgetUser?.budget_id
    if (!budgetId) return NextResponse.json({ error: 'No budget found for user' }, { status: 400 })

    const { error } = await admin
      .from('opening_balance_overrides')
      .upsert({
        budget_id: budgetId,
        year,
        month,
        ars_amount: Number(ars) || 0,
        usd_amount: Number(usd) || 0,
      }, { onConflict: 'budget_id,year,month' })

    if (error) throw error

    return successResponse({ success: true })
  } catch (error) {
    return handleError(error, 'Failed to upsert opening balance override')
  }
}
