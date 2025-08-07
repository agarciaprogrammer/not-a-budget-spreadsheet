'use client'

import { createContext, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface I18nContextType {
  t: (key: string) => string
  i18n: {
    language: string
    changeLanguage: (lng: string) => Promise<unknown>
  }
}

interface I18nProviderProps {
  children: ReactNode
  locale?: string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: I18nProviderProps) {
  const { t, i18n } = useTranslation()

  return (
    <I18nContext.Provider value={{ t, i18n }}>
      {children}
    </I18nContext.Provider>
  )
} 