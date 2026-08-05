import { NextRequest, NextResponse } from 'next/server'
import { accountService } from '@/lib/services/account.service'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await accountService.getAccountBalances(user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 })
    }

    return NextResponse.json(result.data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
