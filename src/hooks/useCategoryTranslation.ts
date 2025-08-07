'use client'

import { useTranslation } from './useTranslation'
import { translateCategory } from '@/lib/utils/category-translations'

export function useCategoryTranslation() {
  const { locale } = useTranslation()

  const translateCategoryName = (categoryName: string): string => {
    return translateCategory(categoryName, locale)
  }

  return {
    translateCategoryName,
    locale
  }
} 