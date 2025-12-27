'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardHeader, CardContent } from '@/components/layout/Card'
import { Button } from '@/components/ui/Button'
import IngredientsTable from '@/components/food/IngredientsTable'
import AddIngredientModal from '@/components/food/AddIngredientModal'
import { FoodDateProvider } from '@/components/providers/FoodDateProvider'
import { useTranslation } from '@/hooks/useTranslation'

export default function FoodPage() {
  const { user, loading, error } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { t } = useTranslation()

  const handleInventoryUpdated = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  // Estados de autenticación
  if (loading) {
    return <LoadingState message={t('food.loading')} className="min-h-screen" />
  }

  if (error) {
    return (
      <ErrorState 
        title={t('food.auth.error.title')}
        message={error}
        className="min-h-screen"
      />
    )
  }

  if (!user) {
    return (
      <ErrorState 
        title={t('food.access.denied.title')}
        message={t('food.access.denied.message')}
        className="min-h-screen"
      />
    )
  }

  return (
    <FoodDateProvider>
      <PageContainer>
        <InventoryPanel
          refreshTrigger={refreshTrigger}
          onAddIngredient={handleOpenModal}
          onRefresh={handleInventoryUpdated}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('food.restock.title')}</h3>
                <p className="text-sm text-gray-500">{t('food.restock.subtitle')}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">{t('food.restock.placeholder')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('food.recipes.title')}</h3>
                <p className="text-sm text-gray-500">{t('food.recipes.subtitle')}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">{t('food.recipes.placeholder')}</div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>

      <AddIngredientModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onIngredientAdded={handleInventoryUpdated}
      />
    </FoodDateProvider>
  )
}

function InventoryPanel({
  refreshTrigger,
  onAddIngredient,
  onRefresh,
}: {
  refreshTrigger: number
  onAddIngredient: () => void
  onRefresh: () => void
}) {
  const { t } = useTranslation()
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{t('food.inventory.title')}</h2>
            <p className="text-sm text-gray-500">{t('food.inventory.subtitle')}</p>
          </div>
          <Button onClick={onAddIngredient}>
            + {t('food.inventory.add')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <IngredientsTable refreshTrigger={refreshTrigger} onRefresh={onRefresh} />
      </CardContent>
    </Card>
  )
}
