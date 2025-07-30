import { NextRequest, NextResponse } from 'next/server'
import { profileService } from '@/lib/services/profile.service'
import { handleError, successResponse } from '@/lib/utils/api-response'

export async function POST(request: NextRequest) {
  try {
    const { username, email } = await request.json()

    // Obtener el usuario actual
    const userResult = await profileService.getCurrentUser()
    if (!userResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar si el username ya está en uso
    const usernameCheckResult = await profileService.isUsernameTaken(username)
    if (usernameCheckResult.success && usernameCheckResult.data) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })
    }

    // Crear el perfil
    const profileResult = await profileService.createProfile(userResult.data.id, {
      username,
      email,
    })

    if (!profileResult.success) {
      return NextResponse.json({ error: profileResult.error.message }, { status: 500 })
    }

    return successResponse({ success: true })
  } catch (error) {
    return handleError(error, 'Profile creation failed')
  }
}
