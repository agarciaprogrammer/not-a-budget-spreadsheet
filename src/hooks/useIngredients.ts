import { useCallback, useEffect, useState } from 'react'
import { ingredientService, type Ingredient } from '@/lib/services/ingredient.service'

export function useIngredients(userId: string, refreshTrigger: number) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadIngredients = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const data = await ingredientService.getIngredients(userId)
      setIngredients(data)
    } catch (error) {
      console.error('Error loading ingredients:', error)
      setError(error instanceof Error ? error.message : 'Error loading ingredients')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadIngredients()
    }
  }, [userId, refreshTrigger, loadIngredients])

  return { ingredients, loading, error }
}
