import { afterEach, describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import AppHeader from '../src/components/AppHeader.vue'
import FilterBar from '../src/components/FilterBar.vue'
import IssueDetails from '../src/components/IssueDetails.vue'
import IssueTable from '../src/components/IssueTable.vue'
import SummaryBar from '../src/components/SummaryBar.vue'
import { setActiveLocale } from '../src/i18n'
import { supportedLocales, type Locale } from '../src/i18n/locales'
import { evaluate } from '../src/rules/engine'
import { defaultConfig, defaultFilters } from '../src/services/config'
import AboutView from '../src/views/AboutView.vue'
import type { AuditIssue, ProjectValue } from '../src/types/domain'

function createIssue(overrides: Partial<AuditIssue> = {}): AuditIssue {
  return {
    id: 'I1',
    number: 12,
    url: 'https://github.com/acme/qa/issues/12',
    title: 'Release | Fluxo de checkout 2026-10-20',
    state: 'open',
    assignees: ['ana-souza'],
    labels: [],
    milestone: 'Sprint 12',
    category: 'task',
    categoryOrigin: 'type',
    createdAt: '2026-10-01T12:00:00Z',
    updatedAt: '2026-10-02T12:00:00Z',
    childIds: [],
    fields: {},
    ...overrides
  }
}

function createField(value: string): ProjectValue {
  return { state: value === '' ? 'empty' : 'value', value }
}

function evaluateIssueWithEmptyFields() {
  const issue = createIssue({
    fields: {
      Status: createField('Todo'),
      Initiative: { state: 'empty' },
      'Bugs Sbx': { state: 'empty' }
    }
  })
  return { issue, result: evaluate([issue], defaultConfig, '2026-10-15T12:00:00Z') }
}

async function render(component: object, props: Record<string, unknown>): Promise<string> {
  return renderToString(createSSRApp({ render: () => h(component, props) }))
}

describe('localized interface', () => {
  afterEach(() => {
    setActiveLocale('pt-BR')
  })

  it.each([
    ['pt-BR', ['Dashboard', 'Sobre', 'Configurações', 'Idioma']],
    ['en', ['Dashboard', 'About', 'Settings', 'Language']],
    ['es', ['Dashboard', 'Acerca de', 'Configuración', 'Idioma']]
  ] as const)('shows the header in %s', async (locale, expectedTexts) => {
    setActiveLocale(locale)

    const markup = await render(AppHeader, {
      currentPage: 'dashboard',
      connectionStatus: 'connected',
      theme: 'light',
      locale
    })

    for (const text of expectedTexts) expect(markup).toContain(text)
  })

  it('offers the three languages by their own names, whatever the active language', async () => {
    for (const locale of supportedLocales) {
      setActiveLocale(locale)

      const markup = await render(AppHeader, {
        currentPage: 'dashboard',
        connectionStatus: 'connected',
        theme: 'light',
        locale
      })

      for (const name of ['Português (Brasil)', 'English', 'Español']) {
        expect(markup).toContain(name)
      }
    }
  })

  it('gives the language selector an accessible name', async () => {
    setActiveLocale('en')

    const markup = await render(AppHeader, {
      currentPage: 'dashboard',
      connectionStatus: 'connected',
      theme: 'light',
      locale: 'en'
    })

    expect(markup).toMatch(/<select[^>]*aria-label="Language"/)
  })

  it.each([
    ['pt-BR', 'Busca', 'Sem responsável', 'Fechamento'],
    ['en', 'Search', 'No assignee', 'Closed'],
    ['es', 'Búsqueda', 'Sin responsable', 'Cierre']
  ] as const)(
    'shows the filters in %s and keeps Task, Subtask, and Start',
    async (locale, search, noAssignee, closed) => {
      setActiveLocale(locale)

      const markup = await render(FilterBar, {
        assignees: ['ana-souza'],
        modelValue: { ...defaultFilters }
      })

      for (const text of [search, noAssignee, closed, 'Task', 'Subtask', 'Start', 'ana-souza']) {
        expect(markup).toContain(text)
      }
    }
  )

  it.each([
    ['pt-BR', 'Issues analisadas'],
    ['en', 'Issues analyzed'],
    ['es', 'Issues analizadas']
  ] as const)('shows the summary in %s', async (locale, label) => {
    setActiveLocale(locale)

    const markup = await render(SummaryBar, {
      analyzedCount: 1234,
      issuesWithProblemsCount: 2,
      findingsCount: 3
    })

    expect(markup).toContain(label)
  })

  it.each([
    ['pt-BR', '1.234'],
    ['en', '1,234'],
    ['es', '1234']
  ] as const)('formats the numbers of the summary for %s', async (locale, expectedNumber) => {
    setActiveLocale(locale)

    const markup = await render(SummaryBar, {
      analyzedCount: 1234,
      issuesWithProblemsCount: 2,
      findingsCount: 3
    })

    expect(markup).toContain(expectedNumber)
  })
})

describe('data from the API stays as received', () => {
  afterEach(() => {
    setActiveLocale('pt-BR')
  })

  it.each(supportedLocales)(
    'keeps the issue title, assignee, and Project status in %s',
    async (locale) => {
      setActiveLocale(locale)
      const issue = createIssue({
        title: 'Hotfix | Correção de frete 2026-10-21',
        fields: { Status: createField('Todo') }
      })

      const markup = await render(IssueTable, {
        issues: [issue],
        findings: [],
        incomplete: [],
        selectedIssueId: undefined
      })

      expect(markup).toContain('Hotfix | Correção de frete 2026-10-21')
      expect(markup).toContain('ana-souza')
      expect(markup).toContain('>Todo<')
    }
  )

  it.each(supportedLocales)(
    'keeps field names and values in the issue panel in %s',
    async (locale) => {
      setActiveLocale(locale)
      const { issue, result } = evaluateIssueWithEmptyFields()

      const markup = await render(IssueDetails, {
        issue,
        findings: result.findings,
        incomplete: result.nonEvaluated,
        isBusy: false,
        isUpdating: false
      })

      expect(markup).toContain('Release | Fluxo de checkout 2026-10-20')
      expect(markup).toContain('Initiative')
      expect(markup).toContain('Bugs Sbx')
    }
  )

  it('translates the message around the field name and keeps the name', async () => {
    const { issue, result } = evaluateIssueWithEmptyFields()
    const expectedTexts = {
      'pt-BR': 'Campo obrigatório não preenchido.',
      en: 'Required field not filled in.',
      es: 'Campo obligatorio sin completar.'
    } satisfies Record<Locale, string>

    for (const locale of supportedLocales) {
      setActiveLocale(locale)
      const markup = await render(IssueDetails, {
        issue,
        findings: result.findings,
        incomplete: result.nonEvaluated,
        isBusy: false,
        isUpdating: false
      })

      expect(markup).toContain(expectedTexts[locale])
      expect(markup).toContain('Initiative')
    }
  })

  it('shows a title field label and a milestone value in each language, without changing the value', async () => {
    const issue = createIssue({ milestone: 'Sprint 12' })
    const result = evaluate([issue], defaultConfig)

    const labels = { 'pt-BR': 'Título', en: 'Title', es: 'Título' } satisfies Record<Locale, string>
    const titleFindings = evaluate(
      [{ ...issue, title: 'sem formato' }],
      defaultConfig
    ).findings.filter((finding) => typeof finding.field === 'object')
    expect(titleFindings.length).toBeGreaterThan(0)

    for (const locale of supportedLocales) {
      setActiveLocale(locale)
      const markup = await render(IssueDetails, {
        issue: { ...issue, title: 'sem formato' },
        findings: titleFindings,
        incomplete: [],
        isBusy: false,
        isUpdating: false
      })

      expect(markup).toContain(labels[locale])
      expect(markup).toContain('sem formato')
    }
    expect(result.findings.some((finding) => finding.field === 'Milestone')).toBe(true)
  })
})

describe('changing the language', () => {
  afterEach(() => {
    setActiveLocale('pt-BR')
  })

  it('shows the findings already computed in the new language, without running the rules again', async () => {
    const { issue, result } = evaluateIssueWithEmptyFields()
    const findingsBeforeSwitch = JSON.stringify(result.findings)
    const props = {
      issue,
      findings: result.findings,
      incomplete: result.nonEvaluated,
      isBusy: false,
      isUpdating: false
    }

    setActiveLocale('pt-BR')
    const portugueseMarkup = await render(IssueDetails, props)
    setActiveLocale('en')
    const englishMarkup = await render(IssueDetails, props)

    expect(portugueseMarkup).toContain('Campo obrigatório não preenchido.')
    expect(englishMarkup).toContain('Required field not filled in.')
    expect(englishMarkup).not.toContain('Campo obrigatório não preenchido.')
    expect(JSON.stringify(result.findings)).toBe(findingsBeforeSwitch)
  })

  it('keeps the validation result identical in every language', () => {
    const resultsByLocale = supportedLocales.map((locale) => {
      setActiveLocale(locale)
      const { result } = evaluateIssueWithEmptyFields()
      return JSON.stringify(result)
    })

    expect(new Set(resultsByLocale).size).toBe(1)
  })

  it('shows the not-evaluated reasons in the new language', async () => {
    const issue = createIssue({ fields: {} })
    const result = evaluate([issue], defaultConfig)
    const props = {
      issue,
      findings: result.findings,
      incomplete: result.nonEvaluated,
      isBusy: false,
      isUpdating: false
    }

    setActiveLocale('en')
    const markup = await render(IssueDetails, props)

    expect(markup).toContain('Could not read:')
    expect(markup).toContain('not queried')
  })

  it.each([
    ['pt-BR', 'Como usar', 'Desenvolvido pelo'],
    ['en', 'How to use', 'Developed by'],
    ['es', 'Cómo usar', 'Desarrollado por']
  ] as const)('shows the About page in %s', async (locale, usageTitle, developedBy) => {
    setActiveLocale(locale)

    const markup = await render(AboutView, { developer: { name: 'QA Macaria' } })

    expect(markup).toContain(usageTitle)
    expect(markup).toContain(developedBy)
    expect(markup).toContain('QA Macaria')
  })

  it.each(supportedLocales)(
    'uses the real control names inside the About steps in %s',
    async (locale) => {
      setActiveLocale(locale)
      const expectedNames = {
        'pt-BR': ['Atualizar análise', 'Atualizar esta issue', 'Abrir no GitHub', 'Configurações'],
        en: ['Refresh analysis', 'Refresh this issue', 'Open on GitHub', 'Settings'],
        es: ['Actualizar análisis', 'Actualizar esta issue', 'Abrir en GitHub', 'Configuración']
      } satisfies Record<Locale, string[]>

      const markup = await render(AboutView, { developer: { name: 'QA Macaria' } })

      for (const name of expectedNames[locale]) expect(markup).toContain(name)
    }
  )

  it.each(supportedLocales)(
    'never shows a translation key in the About page in %s',
    async (locale) => {
      setActiveLocale(locale)

      const markup = await render(AboutView, { developer: { name: 'QA Macaria' } })

      expect(markup).not.toMatch(/\b(about|nav|rules|table|details|settings|filters)\.[a-zA-Z]+/)
    }
  )
})
