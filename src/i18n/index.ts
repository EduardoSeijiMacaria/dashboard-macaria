import { createI18n } from 'vue-i18n'
import { defaultLocale, type Locale } from './locales'
import { en } from './messages/en'
import { es } from './messages/es'
import { ptBR } from './messages/pt-BR'

export const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: defaultLocale,
  messages: { 'pt-BR': ptBR, en, es },
  warnHtmlMessage: false
})

export function getActiveLocale(): Locale {
  return i18n.global.locale.value as Locale
}

export function setActiveLocale(locale: Locale): void {
  i18n.global.locale.value = locale
}
