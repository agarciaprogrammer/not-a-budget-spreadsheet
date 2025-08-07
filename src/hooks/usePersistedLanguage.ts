'use client'

import { useState, useEffect, useCallback } from 'react'

const LANGUAGE_STORAGE_KEY = 'preferred-language'
const DEFAULT_LANGUAGE = 'en'

export function usePersistedLanguage() {
  const [language, setLanguage] = useState<string>(DEFAULT_LANGUAGE)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get saved language from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY)
      if (savedLanguage) {
        setLanguage(savedLanguage)
      }
    }
    setIsLoading(false)
  }, [])

  const saveLanguage = useCallback((newLanguage: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage)
      setLanguage(newLanguage)
    }
  }, [])

  const getSavedLanguage = useCallback((): string => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE
    }
    return DEFAULT_LANGUAGE
  }, [])

  return {
    language,
    saveLanguage,
    getSavedLanguage,
    isLoading
  }
} 