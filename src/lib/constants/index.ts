// Rutas de la aplicación
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  CALLBACK: '/auth/callback',
} as const

// Tipos de transacciones
export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const

// Roles de usuario
export const USER_ROLES = {
  OWNER: 'owner',
  COLLABORATOR: 'collaborator',
} as const

// Estados de autenticación
export const AUTH_STATES = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error',
} as const

// Códigos de error comunes
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const

// Mensajes de error
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'You must be logged in to access this resource',
  NOT_FOUND: 'The requested resource was not found',
  VALIDATION_ERROR: 'The provided data is invalid',
  INTERNAL_ERROR: 'An internal error occurred',
  NETWORK_ERROR: 'Network error. Please check your connection',
  BUDGET_NOT_FOUND: 'No budget found for user',
  TRANSACTION_CREATE_FAILED: 'Failed to create transaction',
  TRANSACTION_DELETE_FAILED: 'Failed to delete transaction',
  PROFILE_CREATE_FAILED: 'Failed to create profile',
  USERNAME_TAKEN: 'Username is already taken',
} as const

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const

// Configuración de validación
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 20,
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 999999999.99,
} as const

// Configuración de UI
export const UI = {
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
  MODAL_ANIMATION_DURATION: 200,
  LOADING_TIMEOUT: 10000,
} as const

// Configuración de localStorage
export const STORAGE_KEYS = {
  THEME: 'app-theme',
  LANGUAGE: 'app-language',
  USER_PREFERENCES: 'user-preferences',
} as const

// Configuración de API
export const API = {
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const

// Categorías por defecto
export const DEFAULT_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Other',
] as const

// Configuración de moneda
export const CURRENCY = {
  DEFAULT: 'ARS',
  LOCALE: 'es-ES',
  SYMBOL: '$',
} as const

// Configuración de fecha
export const DATE = {
  LOCALE: 'es-ES',
  FORMAT: 'dd/MM/yyyy',
} as const 