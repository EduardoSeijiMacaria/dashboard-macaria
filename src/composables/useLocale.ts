import { computed } from 'vue'
import { getActiveLocale, i18n, setActiveLocale } from '../i18n'
import { readSavedLocale, resolveInitialLocale, saveLocale, type Locale } from '../i18n/locales'
import { t } from '../i18n/translate'

function getBrowserStorage(): Storage {
  return window.localStorage
}

function listBrowserLanguages(): readonly string[] {
  if (navigator.languages && navigator.languages.length > 0) return navigator.languages
  return [navigator.language]
}

function applyLocale(locale: Locale): void {
  setActiveLocale(locale)
  document.documentElement.lang = locale
  document.title = t('app.title')
}

export function initializeLocale(): void {
  const savedLocale = readSavedLocale(getBrowserStorage)
  applyLocale(resolveInitialLocale(savedLocale, listBrowserLanguages()))
}

export function useLocale() {
  const locale = computed(() => i18n.global.locale.value as Locale)

  function changeLocale(newLocale: Locale): void {
    if (newLocale === getActiveLocale()) return
    applyLocale(newLocale)
    saveLocale(getBrowserStorage, newLocale)
  }

  return { locale, changeLocale }
}
