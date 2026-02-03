// Category translations mapping
const categoryTranslations = {
  en: {
    // Common categories in English
    'Food': 'Food',
    'Transport': 'Transport',
    'Entertainment': 'Entertainment',
    'Shopping': 'Shopping',
    'Bills & Utilities': 'Bills & Utilities',
    'Healthcare': 'Healthcare',
    'Education': 'Education',
    'Transportation': 'Transportation',
    'Groceries': 'Groceries',
    'Utilities': 'Utilities',
    'Rent': 'Rent',
    'Insurance': 'Insurance',
    'Gym': 'Gym',
    'Restaurants': 'Restaurants',
    'Gas': 'Gas',
    'Clothing': 'Clothing',
    'Electronics': 'Electronics',
    'Home': 'Home',
    'Personal Care': 'Personal Care',
    'Subscriptions': 'Subscriptions',
    'Gifts': 'Gifts',
    'Donations': 'Donations',
    'Investment': 'Investment',
    'Food & Dining': 'Food & Dining',
    'Other': 'Other',
    // Fixed categories (Spanish canonical)
    'Expensas': 'Building Fees',
    'Servicios - Luz': 'Utilities - Electricity',
    'Servicios - Gas': 'Utilities - Gas',
    'Servicios - Agua': 'Utilities - Water',
    'Internet': 'Internet',
    'Teléfono móvil': 'Mobile Phone',
    'Obra social / Salud': 'Health Insurance',
    'Suscripciones esenciales': 'Essential Subscriptions',
    // Variable categories (Spanish canonical)
    'Pedidos / Delivery': 'Delivery',
    'Salidas': 'Going Out',
    'Supermercado': 'Groceries',
    'Gustos personales': 'Personal Treats',
    'Libros': 'Books',
    'Tecnologia': 'Technology',
    'Música': 'Music',
    'Compras para el hogar': 'Home Purchases',
    'Transporte': 'Transport',
    'Compras duraderas': 'Durable Purchases',
    'Regalos': 'Gifts',
    'Ropa': 'Clothing',
    // Income categories
    'Salary': 'Salary',
    'Freelance': 'Freelance',
    'Investment Returns': 'Investment Returns',
    'Bonus': 'Bonus',
    'Side Hustle': 'Side Hustle'
  },
  es: {
    // Common categories in Spanish
    'Food': 'Comida',
    'Transport': 'Transporte',
    'Entertainment': 'Entretenimiento',
    'Shopping': 'Compras',
    'Bills & Utilities': 'Facturas',
    'Healthcare': 'Salud',
    'Education': 'Educación',
    'Transportation': 'Transporte',
    'Groceries': 'Supermercado',
    'Utilities': 'Servicios',
    'Rent': 'Alquiler',
    'Insurance': 'Seguros',
    'Gym': 'Gimnasio',
    'Restaurants': 'Restaurantes',
    'Gas': 'Gasolina',
    'Clothing': 'Ropa',
    'Electronics': 'Electrónicos',
    'Home': 'Hogar',
    'Personal Care': 'Cuidado Personal',
    'Subscriptions': 'Suscripciones',
    'Gifts': 'Regalos',
    'Donations': 'Donaciones',
    'Investment': 'Inversiones',
    'Other': 'Otros',
    'Food & Dining': 'Comida',
    // Fixed categories (Spanish canonical)
    'Expensas': 'Expensas',
    'Servicios - Luz': 'Servicios - Luz',
    'Servicios - Gas': 'Servicios - Gas',
    'Servicios - Agua': 'Servicios - Agua',
    'Internet': 'Internet',
    'Teléfono móvil': 'Teléfono móvil',
    'Obra social / Salud': 'Obra social / Salud',
    'Suscripciones esenciales': 'Suscripciones esenciales',
    // Variable categories (Spanish canonical)
    'Pedidos / Delivery': 'Pedidos / Delivery',
    'Salidas': 'Salidas',
    'Supermercado': 'Supermercado',
    'Gustos personales': 'Gustos personales',
    'Libros': 'Libros',
    'Tecnologia': 'Tecnologia',
    'Música': 'Música',
    'Compras para el hogar': 'Compras para el hogar',
    'Transporte': 'Transporte',
    'Compras duraderas': 'Compras duraderas',
    'Regalos': 'Regalos',
    'Ropa': 'Ropa',
    // Income categories
    'Salary': 'Salario',
    'Freelance': 'Trabajo Independiente',
    'Investment Returns': 'Retornos de Inversión',
    'Bonus': 'Bono',
    'Side Hustle': 'Trabajo Extra'
  }
}

export function translateCategory(categoryName: string, locale: string = 'en'): string {
  // Normalize locale to just language code
  const lang = locale.split('-')[0].toLowerCase()
  
  // Get translations for the current language, fallback to English
  const translations = categoryTranslations[lang as keyof typeof categoryTranslations] || categoryTranslations.en
  
  // Return translation or original name if not found
  return translations[categoryName as keyof typeof translations] || categoryName
}

export function getAvailableCategories(locale: string = 'en'): string[] {
  const lang = locale.split('-')[0].toLowerCase()
  const translations = categoryTranslations[lang as keyof typeof categoryTranslations] || categoryTranslations.en
  
  return Object.values(translations)
}

// Function to get the original English name from a translated name (useful for reverse lookup)
export function getOriginalCategoryName(translatedName: string, locale: string = 'en'): string {
  const lang = locale.split('-')[0].toLowerCase()
  const translations = categoryTranslations[lang as keyof typeof categoryTranslations] || categoryTranslations.en
  
  // Find the key that has this translated value
  for (const [originalName, translation] of Object.entries(translations)) {
    if (translation === translatedName) {
      return originalName
    }
  }
  
  // If not found, return the original string
  return translatedName
} 
