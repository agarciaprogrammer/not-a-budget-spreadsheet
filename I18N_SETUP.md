# Internationalization (i18n) Setup

This project has been configured with next-i18next to support multiple languages.

## Configuration Files

### 1. Next.js Configuration (`next.config.ts`)
```typescript
i18n: {
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localeDetection: false,
}
```

### 2. next-i18next Configuration (`next-i18next.config.js`)
```javascript
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
  },
  localePath: './locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
}
```

## File Structure

```
locales/
├── en/
│   └── common.json
└── es/
    └── common.json
```

## Usage

### 1. Using Translations in Components

```tsx
import { useTranslation } from '@/hooks/useTranslation'

export function MyComponent() {
  const { t } = useTranslation()
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('loading')}</p>
    </div>
  )
}
```

### 2. Language Switcher Component

```tsx
import { LanguageSwitcher } from '@/components/ui'

export function Header() {
  return (
    <header>
      <LanguageSwitcher />
    </header>
  )
}
```

### 3. Adding New Translations

1. Add keys to `locales/en/common.json`:
```json
{
  "newKey": "English text"
}
```

2. Add corresponding translations to `locales/es/common.json`:
```json
{
  "newKey": "Texto en español"
}
```

## Available Hooks

- `useTranslation(namespace?)` - Returns translation function and i18n instance
- `LanguageSwitcher` - Component for switching between languages

## Supported Languages

- **English (en)** - Default language
- **Spanish (es)** - Secondary language

## Provider Setup

The i18n provider is configured in `src/app/layout.tsx` and wraps the entire application:

```tsx
<I18nProvider locale="en">
  <AuthProvider>
    {/* Your app content */}
  </AuthProvider>
</I18nProvider>
``` 