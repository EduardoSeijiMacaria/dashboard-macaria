export const supportedLocales = ['pt-BR', 'en', 'es'] as const

export type Locale = (typeof supportedLocales)[number]

export const defaultLocale: Locale = 'pt-BR'

export const localeNames: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)',
  en: 'English',
  es: 'Español'
}

const localeStorageKey = 'qa-dashboard-locale'

export function isLocale(value: unknown): value is Locale {
  return supportedLocales.some((locale) => locale === value)
}

export function matchBrowserLanguage(browserLanguage: string): Locale | null {
  const languageCode = browserLanguage.toLowerCase().split('-')[0]
  if (languageCode === 'pt') return 'pt-BR'
  if (languageCode === 'en') return 'en'
  if (languageCode === 'es') return 'es'
  return null
}

export function resolveInitialLocale(
  savedLocale: Locale | null,
  browserLanguages: readonly string[]
): Locale {
  if (savedLocale) return savedLocale
  for (const browserLanguage of browserLanguages) {
    const matchedLocale = matchBrowserLanguage(browserLanguage)
    if (matchedLocale) return matchedLocale
  }
  return defaultLocale
}

export function readSavedLocale(getStorage: () => Storage): Locale | null {
  try {
    const savedValue = getStorage().getItem(localeStorageKey)
    return isLocale(savedValue) ? savedValue : null
  } catch (error) {
    console.warn('LocaleReadFailed', error)
    return null
  }
}

export function saveLocale(getStorage: () => Storage, locale: Locale): void {
  try {
    getStorage().setItem(localeStorageKey, locale)
  } catch (error) {
    console.warn('LocaleSaveFailed', error)
  }
}
