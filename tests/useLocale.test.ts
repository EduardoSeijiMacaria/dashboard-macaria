import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getActiveLocale, setActiveLocale } from '../src/i18n'
import { initializeLocale, useLocale } from '../src/composables/useLocale'

interface FakeBrowser {
  storedValues: Record<string, string>
  documentElement: { lang: string }
  document: { documentElement: { lang: string }; title: string }
}

function stubBrowser(
  options: { stored?: Record<string, string>; languages?: string[]; blocked?: boolean } = {}
): FakeBrowser {
  const storedValues = { ...options.stored }
  const documentElement = { lang: 'pt-BR' }
  const document = { documentElement, title: '' }
  const localStorage = {
    getItem: (key: string) => {
      if (options.blocked) throw new Error('blocked')
      return storedValues[key] ?? null
    },
    setItem: (key: string, value: string) => {
      if (options.blocked) throw new Error('blocked')
      storedValues[key] = value
    }
  }
  vi.stubGlobal('window', { localStorage })
  vi.stubGlobal('document', document)
  vi.stubGlobal('navigator', {
    languages: options.languages ?? [],
    language: options.languages?.[0] ?? ''
  })
  return { storedValues, documentElement, document }
}

describe('initializeLocale', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    setActiveLocale('pt-BR')
  })

  it('restores the saved language', () => {
    stubBrowser({ stored: { 'qa-dashboard-locale': 'es' }, languages: ['en-US'] })

    initializeLocale()

    expect(getActiveLocale()).toBe('es')
  })

  it('uses the browser language when nothing is saved', () => {
    stubBrowser({ languages: ['en-GB'] })

    initializeLocale()

    expect(getActiveLocale()).toBe('en')
  })

  it('uses pt-BR when the browser language is not supported', () => {
    stubBrowser({ languages: ['ja-JP'] })

    initializeLocale()

    expect(getActiveLocale()).toBe('pt-BR')
  })

  it('ignores an invalid saved value', () => {
    stubBrowser({ stored: { 'qa-dashboard-locale': 'klingon' }, languages: ['es-AR'] })

    initializeLocale()

    expect(getActiveLocale()).toBe('es')
  })

  it('still starts when the storage is blocked', () => {
    stubBrowser({ blocked: true, languages: ['en'] })

    expect(() => initializeLocale()).not.toThrow()
    expect(getActiveLocale()).toBe('en')
  })

  it('updates the lang attribute and the page title', () => {
    const browser = stubBrowser({ stored: { 'qa-dashboard-locale': 'en' } })

    initializeLocale()

    expect(browser.documentElement.lang).toBe('en')
    expect(browser.document.title).toBe('Macaria QA — Issue consistency')
  })
})

describe('changeLocale', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    setActiveLocale('pt-BR')
  })

  it('switches the language, saves it, and updates the lang attribute', () => {
    const browser = stubBrowser()
    const { changeLocale, locale } = useLocale()

    changeLocale('es')

    expect(locale.value).toBe('es')
    expect(browser.storedValues['qa-dashboard-locale']).toBe('es')
    expect(browser.documentElement.lang).toBe('es')
  })

  it('does not touch the theme preference', () => {
    const browser = stubBrowser({ stored: { 'qa-dashboard-theme': 'dark' } })

    useLocale().changeLocale('en')

    expect(browser.storedValues['qa-dashboard-theme']).toBe('dark')
  })

  it('switches the language even when the storage is blocked', () => {
    stubBrowser({ blocked: true })
    const { changeLocale, locale } = useLocale()

    expect(() => changeLocale('en')).not.toThrow()
    expect(locale.value).toBe('en')
  })

  it('makes no request when the language changes', () => {
    stubBrowser()
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    useLocale().changeLocale('es')

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('does nothing when the chosen language is already active', () => {
    const browser = stubBrowser()
    setActiveLocale('en')

    useLocale().changeLocale('en')

    expect(browser.storedValues).toEqual({})
  })
})
