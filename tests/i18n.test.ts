import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setActiveLocale } from '../src/i18n'
import {
  defaultLocale,
  matchBrowserLanguage,
  readSavedLocale,
  resolveInitialLocale,
  saveLocale,
  supportedLocales,
  type Locale
} from '../src/i18n/locales'
import { en } from '../src/i18n/messages/en'
import { es } from '../src/i18n/messages/es'
import { ptBR } from '../src/i18n/messages/pt-BR'
import { formatList, t, translateMessage, translateText } from '../src/i18n/translate'

function listKeys(messages: object, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([name, value]) => {
    const path = prefix ? `${prefix}.${name}` : name
    return typeof value === 'string' ? [path] : listKeys(value, path)
  })
}

function listValues(messages: object): string[] {
  return Object.values(messages).flatMap((value) =>
    typeof value === 'string' ? [value] : listValues(value)
  )
}

const catalogs: Record<Locale, object> = { 'pt-BR': ptBR, en, es }

describe('message catalogs', () => {
  it.each([['en'], ['es']] as const)('%s has exactly the keys of pt-BR', (locale) => {
    expect(listKeys(catalogs[locale]).sort()).toEqual(listKeys(ptBR).sort())
  })

  it.each(supportedLocales)('%s has no empty text', (locale) => {
    expect(listValues(catalogs[locale]).filter((text) => text.trim() === '')).toEqual([])
  })

  it.each([['en'], ['es']] as const)(
    '%s uses the same placeholders as pt-BR in every text',
    (locale) => {
      const placeholdersOf = (messages: object) =>
        Object.fromEntries(
          listKeys(messages).map((key) => {
            const text = key
              .split('.')
              .reduce<unknown>((node, part) => (node as never)[part], messages)
            return [key, [...String(text).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()]
          })
        )

      expect(placeholdersOf(catalogs[locale])).toEqual(placeholdersOf(ptBR))
    }
  )

  it('keeps the environment variable names in the technical errors of every language', () => {
    for (const locale of supportedLocales) {
      const errors = (catalogs[locale] as typeof ptBR).errors
      expect(errors.tokenMissing).toContain('GIT_TOKEN')
      expect(errors.repositoryMissing).toContain('REPOSITORY_URL')
      expect(errors.projectNumberInvalid).toContain('PROJECT_NUMBER')
    }
  })
})

describe('resolveInitialLocale', () => {
  it.each([
    ['a saved choice wins over the browser', 'es', ['en-US'], 'es'],
    ['pt-BR from the browser', null, ['pt-BR'], 'pt-BR'],
    ['plain pt from the browser', null, ['pt'], 'pt-BR'],
    ['pt-PT from the browser', null, ['pt-PT'], 'pt-BR'],
    ['en-US from the browser', null, ['en-US'], 'en'],
    ['es-MX from the browser', null, ['es-MX'], 'es'],
    ['the first supported browser language', null, ['fr-FR', 'es-AR', 'en'], 'es'],
    ['an unsupported browser language', null, ['fr-FR', 'de'], 'pt-BR'],
    ['no browser language', null, [], 'pt-BR']
  ] as const)('uses %s', (_caseName, savedLocale, browserLanguages, expectedLocale) => {
    expect(resolveInitialLocale(savedLocale, browserLanguages)).toBe(expectedLocale)
  })

  it('falls back to pt-BR', () => {
    expect(defaultLocale).toBe('pt-BR')
  })

  it.each([
    ['PT-br', 'pt-BR'],
    ['EN', 'en'],
    ['es-CL', 'es'],
    ['ja', null]
  ])('matches the browser language %s to %s', (browserLanguage, expectedLocale) => {
    expect(matchBrowserLanguage(browserLanguage)).toBe(expectedLocale)
  })
})

describe('saved locale', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function createStorage(initial: Record<string, string> = {}) {
    const values = { ...initial }
    return {
      values,
      storage: {
        getItem: (key: string) => values[key] ?? null,
        setItem: (key: string, value: string) => {
          values[key] = value
        }
      } as unknown as Storage
    }
  }

  it.each(supportedLocales)('reads the saved %s', (locale) => {
    const { storage } = createStorage({ 'qa-dashboard-locale': locale })

    expect(readSavedLocale(() => storage)).toBe(locale)
  })

  it.each([['fr'], ['EN'], ['pt'], ['']])('ignores the invalid saved value %j', (savedValue) => {
    const { storage } = createStorage({ 'qa-dashboard-locale': savedValue })

    expect(readSavedLocale(() => storage)).toBeNull()
  })

  it('reads nothing when there is no saved value', () => {
    expect(readSavedLocale(() => createStorage().storage)).toBeNull()
  })

  it('keeps working when the storage is blocked on read', () => {
    const blocked = () => {
      throw new Error('blocked')
    }

    expect(readSavedLocale(blocked)).toBeNull()
    expect(console.warn).toHaveBeenCalledWith('LocaleReadFailed', expect.any(Error))
  })

  it('keeps working when the storage is blocked on write', () => {
    const blocked = () => {
      throw new Error('blocked')
    }

    expect(() => saveLocale(blocked, 'en')).not.toThrow()
    expect(console.warn).toHaveBeenCalledWith('LocaleSaveFailed', expect.any(Error))
  })

  it('saves the locale and the theme in separate keys, so they stay independent', () => {
    const { storage, values } = createStorage({ 'qa-dashboard-theme': 'dark' })

    saveLocale(() => storage, 'es')

    expect(values).toEqual({ 'qa-dashboard-theme': 'dark', 'qa-dashboard-locale': 'es' })
  })
})

describe('translate', () => {
  afterEach(() => {
    setActiveLocale('pt-BR')
  })

  it.each([
    ['pt-BR', 'Campo obrigatório quando o Status for diferente de Todo.'],
    ['en', 'Required field when the Status is different from Todo.'],
    ['es', 'Campo obligatorio cuando el Status sea distinto de Todo.']
  ] as const)('translates a message with data into %s', (locale, expectedText) => {
    setActiveLocale(locale)

    const text = translateMessage({
      key: 'rules.startRequired',
      params: { statusField: 'Status', optionalStatus: 'Todo' }
    })

    expect(text).toBe(expectedText)
  })

  it.each(supportedLocales)(
    'keeps field names and values from the API as they are in %s',
    (locale) => {
      setActiveLocale(locale)

      const text = translateMessage({
        key: 'rules.ffConflict',
        params: { featureFlagName: 'FF Name', featureFlagStatus: 'FF Status', noFlag: 'No FF' }
      })

      expect(text).toContain('FF Name')
      expect(text).toContain('FF Status')
      expect(text).toContain('No FF')
    }
  )

  it.each(supportedLocales)('shows a literal text as it is in %s', (locale) => {
    setActiveLocale(locale)

    expect(translateText('Start')).toBe('Start')
    expect(translateText('QA Apply')).toBe('QA Apply')
  })

  it('translates a message used as a field label', () => {
    setActiveLocale('en')
    expect(translateText({ key: 'fields.title' })).toBe('Title')
    setActiveLocale('es')
    expect(translateText({ key: 'fields.title' })).toBe('Título')
  })

  it('translates a message inside another message', () => {
    setActiveLocale('en')

    const text = translateMessage({
      key: 'notEvaluated.statusUnknown',
      params: {
        statusField: 'Status',
        state: { key: 'availability.no-access' },
        optionalStatus: 'Todo'
      }
    })

    expect(text).toBe('Status no access: it is not possible to know whether it differs from Todo.')
  })

  it.each([
    ['pt-BR', 'Quality Assistance 2026 ou Quality Engineering 2026'],
    ['en', 'Quality Assistance 2026 or Quality Engineering 2026'],
    ['es', 'Quality Assistance 2026 o Quality Engineering 2026']
  ] as const)('joins a list with the right word in %s', (locale, expectedText) => {
    setActiveLocale(locale)

    expect(formatList(['Quality Assistance 2026', 'Quality Engineering 2026'], 'or')).toBe(
      expectedText
    )
  })

  it.each([
    ['pt-BR', 1, '1 erro'],
    ['pt-BR', 2, '2 erros'],
    ['pt-BR', 0, '0 erros'],
    ['en', 1, '1 error'],
    ['en', 3, '3 errors'],
    ['es', 1, '1 error'],
    ['es', 4, '4 errores']
  ] as const)('writes the count in %s for %i', (locale, count, expectedText) => {
    setActiveLocale(locale)

    expect(t('table.errorCount', { count }, count)).toBe(expectedText)
  })

  it('falls back to pt-BR for a language the app does not have', () => {
    setActiveLocale('fr' as Locale)

    expect(t('nav.about')).toBe('Sobre')
  })
})
