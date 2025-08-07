'use client'

import { useTranslation as useI18nTranslation } from 'react-i18next'

export function useTranslation(namespace: string = 'common') {
  // Siempre llamar useI18nTranslation sin try-catch
  const { t, i18n } = useI18nTranslation(namespace)
  
  return {
    t,
    i18n,
    locale: i18n.language,
    changeLanguage: i18n.changeLanguage,
  }
} 