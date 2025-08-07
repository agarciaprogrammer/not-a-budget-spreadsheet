'use client'

import { useTranslation } from '@/hooks/useTranslation'
import { Button } from './Button'

export function LanguageSwitcher() {
  const { locale, changeLanguage } = useTranslation()

  const handleLanguageChange = (newLocale: string) => {
    changeLanguage(newLocale)
  }

  return (
    <div className="flex gap-2">
      <Button
        variant={locale === 'en' ? 'primary' : 'secondary'}
        size="sm"
        onClick={() => handleLanguageChange('en')}
      >
        EN
      </Button>
      <Button
        variant={locale === 'es' ? 'primary' : 'secondary'}
        size="sm"
        onClick={() => handleLanguageChange('es')}
      >
        ES
      </Button>
    </div>
  )
} 