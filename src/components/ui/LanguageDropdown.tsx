'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { usePersistedLanguage } from '@/hooks/usePersistedLanguage'

const languages = [
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español' }
]

export function LanguageDropdown() {
  const { i18n, locale, t } = useTranslation()
  const { language: persistedLanguage, saveLanguage } = usePersistedLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Use the persisted language or fall back to the i18n locale
  const currentLocale = persistedLanguage || locale
  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLanguageChange = async (languageCode: string) => {
    try {
      // Save the selected language using the hook
      saveLanguage(languageCode)
      
      await i18n.changeLanguage(languageCode)
      setIsOpen(false)
      
      // Reload the page to ensure all components reflect the new language
      // This maintains the current route while reloading
      const currentPath = window.location.pathname + window.location.search
      window.location.href = currentPath
    } catch (error) {
      console.error('Error changing language:', error)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/30 transition bg-white/20 backdrop-blur-sm shadow-lg border cursor-pointer"
        title={t('nav.change.language')}
      >
        <span className="text-lg">{currentLanguage.flag}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[120px] z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm cursor-pointer ${
                currentLocale === language.code ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'
              }`}
            >
              <span>{language.flag}</span>
              <span>{language.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 