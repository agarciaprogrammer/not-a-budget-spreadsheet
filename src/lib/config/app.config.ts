export interface AppConfig {
  app: {
    name: string
    version: string
    environment: 'development' | 'production' | 'test'
  }
  api: {
    baseUrl: string
    timeout: number
  }
  auth: {
    sessionTimeout: number
    refreshTokenInterval: number
  }
  currency: {
    default: string
    locale: string
  }
  date: {
    locale: string
    format: string
  }
  features: {
    enableLogging: boolean
    enableAnalytics: boolean
    enableErrorReporting: boolean
  }
}

const developmentConfig: AppConfig = {
  app: {
    name: 'Not A Budget Spreadsheet',
    version: '1.0.0',
    environment: 'development',
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    timeout: 10000,
  },
  auth: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    refreshTokenInterval: 5 * 60 * 1000, // 5 minutes
  },
  currency: {
    default: 'ARS',
    locale: 'es-ES',
  },
  date: {
    locale: 'es-ES',
    format: 'dd/MM/yyyy',
  },
  features: {
    enableLogging: true,
    enableAnalytics: false,
    enableErrorReporting: false,
  },
}

const productionConfig: AppConfig = {
  ...developmentConfig,
  app: {
    ...developmentConfig.app,
    environment: 'production',
  },
  features: {
    enableLogging: true,
    enableAnalytics: true,
    enableErrorReporting: true,
  },
}

const testConfig: AppConfig = {
  ...developmentConfig,
  app: {
    ...developmentConfig.app,
    environment: 'test',
  },
  features: {
    enableLogging: false,
    enableAnalytics: false,
    enableErrorReporting: false,
  },
}

export function getConfig(): AppConfig {
  const env = process.env.NODE_ENV || 'development'
  
  switch (env) {
    case 'production':
      return productionConfig
    case 'test':
      return testConfig
    default:
      return developmentConfig
  }
}

export const config = getConfig() 