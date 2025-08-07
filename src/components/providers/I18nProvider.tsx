'use client'

import { createContext, ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import initI18next from '@/lib/i18n/client'

interface I18nContextType {
  t: (key: string) => string
  i18n: {
    language: string
    changeLanguage: (lng: string) => Promise<unknown>
  }
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

// Fallback translation function
const fallbackT = (key: string) => key

interface I18nProviderProps {
  children: ReactNode
  locale?: string
}

// Función para obtener el idioma guardado en localStorage
const getSavedLanguage = (): string => {
  if (typeof window !== 'undefined') {
    const savedLanguage = localStorage.getItem('preferred-language')
    if (savedLanguage) {
      return savedLanguage
    }
  }
  return 'en' // fallback
}

export function I18nProvider({ children, locale }: I18nProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Obtener el idioma guardado en localStorage o usar el locale proporcionado
    const savedLanguage = getSavedLanguage()
    const initialLocale = locale || savedLanguage

    const initializeI18n = async () => {
      try {
        await initI18next(initialLocale, 'common')
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize i18next:', error)
        setHasError(true)
        setIsInitialized(true) // Continue anyway
      }
    }

    initializeI18n()
  }, [locale])

  if (!isInitialized) {
    return <div>Loading translations...</div>
  }

  if (hasError) {
    // Provide fallback context when i18next fails
    return (
      <I18nContext.Provider value={{
        t: fallbackT,
        i18n: {
          language: getSavedLanguage(),
          changeLanguage: async () => Promise.resolve()
        }
      }}>
        {children}
      </I18nContext.Provider>
    )
  }

  return <I18nProviderContent>{children}</I18nProviderContent>
}

function I18nProviderContent({ children }: { children: ReactNode }) {
  // Siempre llamar useTranslation sin try-catch
  const { t, i18n } = useTranslation()

  return (
    <I18nContext.Provider value={{ t, i18n }}>
      {children}
    </I18nContext.Provider>
  )
} 