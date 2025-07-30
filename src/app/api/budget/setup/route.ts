import { NextResponse } from 'next/server'
import { budgetApiService } from '@/lib/services/budget-api.service'
import { handleError, handleResult } from '@/lib/utils/api-response'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Obtener el usuario autenticado
    const userResult = await budgetApiService.getCurrentUser()
    if (!userResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Configurar presupuesto por defecto
    const setupResult = await budgetApiService.setupDefaultBudget(userResult.data.id)
    return handleResult(setupResult, 'Budget setup completed successfully')

  } catch (error) {
    return handleError(error, 'Budget setup failed')
  }
} 