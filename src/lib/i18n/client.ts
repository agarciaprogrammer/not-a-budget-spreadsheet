import { createInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'

// Import translation resources directly
import enCommon from '../../../locales/en/common.json'
import esCommon from '../../../locales/es/common.json'

const resources = {
  en: {
    common: enCommon
  },
  es: {
    common: esCommon
  }
}

const initI18next = async (locale: string, ns: string) => {
  const i18nInstance = createInstance()
  
  try {
    await i18nInstance
      .use(initReactI18next)
      .init({
        lng: locale,
        fallbackLng: 'en',
        supportedLngs: ['en', 'es'],
        defaultNS: ns,
        fallbackNS: 'common',
        debug: process.env.NODE_ENV === 'development',
        resources,
        interpolation: {
          escapeValue: false, // React already escapes values
        },
        react: {
          useSuspense: false, // Important for SSR
        },
      })
    
    return i18nInstance
  } catch (error) {
    console.error('Error initializing i18next:', error)
    throw error
  }
}

export default initI18next 