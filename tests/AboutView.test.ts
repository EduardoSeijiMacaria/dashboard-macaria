import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import AboutView from '../src/views/AboutView.vue'
import type { DeveloperInfo } from '../src/types/domain'

async function renderAbout(developer: DeveloperInfo): Promise<string> {
  const app = createSSRApp({ render: () => h(AboutView, { developer }) })
  return renderToString(app)
}

describe('AboutView', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('explains the purpose, the read-only behavior, and the steps with the real control names', async () => {
    const markup = await renderAbout({ name: 'QA Macaria' })

    expect(markup).toContain('só lê dados')
    expect(markup).toContain('Somente leitura')
    for (const controlName of [
      'Atualizar análise',
      'Atualizar esta issue',
      'Abrir no GitHub',
      'Busca',
      'Responsável',
      'Tipo da issue',
      'Severidade',
      'Situação',
      'Período'
    ]) {
      expect(markup, `the page should name "${controlName}"`).toContain(controlName)
    }
  })

  it('keeps publisher details out of the page: no .env, token, or permissions', async () => {
    const markup = await renderAbout({ name: 'QA Macaria' })

    expect(markup).not.toMatch(/\.env|GIT_TOKEN|REPOSITORY_URL|PROJECT_NUMBER|token|Read-only/i)
  })

  it('has no accordion, because the page now holds only user information', async () => {
    const markup = await renderAbout({ name: 'QA Macaria' })

    expect(markup).not.toContain('<details')
  })

  it('explains error, warning, and not evaluated', async () => {
    const markup = await renderAbout({ name: 'QA Macaria' })

    for (const term of ['1 erro', '1 aviso', 'Não avaliada', 'Sem problemas']) {
      expect(markup, `the page should show "${term}"`).toContain(term)
    }
  })

  it('says it was developed by QA Macaria and that the contact is not configured when there is none', async () => {
    const markup = await renderAbout({ name: 'QA Macaria' })

    expect(markup).toContain('Desenvolvido pelo')
    expect(markup).toContain('QA Macaria')
    expect(markup).toContain('Contato ainda não configurado')
    expect(markup).not.toContain('mailto:')
  })

  it('shows the invitation and the address as a working link when a contact is configured', async () => {
    const markup = await renderAbout({
      name: 'QA Macaria',
      contact: {
        name: 'e-mail',
        url: 'mailto:qa@example.test',
        display: 'qa@example.test'
      }
    })

    expect(markup).toContain('href="mailto:qa@example.test"')
    expect(markup).toContain('Dúvidas, sugestões, relatos de problemas etc.?')
    expect(markup).toContain('qa@example.test</a>')
    expect(markup).not.toContain('Contato ainda não configurado')
  })

  it('shows the channel name as the link text when there is no display text', async () => {
    const markup = await renderAbout({
      name: 'QA Macaria',
      contact: { name: 'Canal de QA', url: 'https://example.test/contato' }
    })

    expect(markup).toContain('href="https://example.test/contato"')
    expect(markup).toContain('Canal de QA</a>')
  })

  it('shows no link for an unsafe contact address', async () => {
    const markup = await renderAbout({
      name: 'QA Macaria',
      contact: { name: 'Canal', url: 'javascript:alert(1)' }
    })

    expect(markup).not.toContain('javascript:')
    expect(markup).toContain('Contato ainda não configurado')
  })

  it('presents the four implemented capabilities as cards', async () => {
    const markup = await renderAbout({ name: 'QA Macaria' })

    for (const title of [
      'Consultar issues e Project',
      'Achar campos fora do padrão',
      'Filtrar os resultados',
      'Ver o que corrigir'
    ]) {
      expect(markup).toContain(title)
    }
  })

  it('numbers the steps in the order of the real flow', async () => {
    const markup = await renderAbout({ name: 'QA Macaria' })
    const stepTitles = [
      'Conferir a conexão',
      'Carregar os dados',
      'Filtrar',
      'Analisar as inconsistências',
      'Corrigir no GitHub',
      'Conferir a correção'
    ]

    const positions = stepTitles.map((title) => markup.indexOf(`>${title}</h4>`))

    expect(positions.every((position) => position > 0)).toBe(true)
    expect([...positions].sort((first, second) => first - second)).toEqual(positions)
  })

  it('does not promise real-time updates and says nothing is kept besides the theme', async () => {
    const markup = await renderAbout({ name: 'QA Macaria' })

    expect(markup).toContain('Isso não é acompanhamento em tempo real')
    expect(markup).toContain('Nada é guardado no navegador, exceto a escolha de tema')
  })

  it('shows no internal rule code', async () => {
    const markup = await renderAbout({ name: 'QA Macaria' })

    expect(markup).not.toMatch(/\b(TASK|SUB|FF|DATE|FIELD)-\d{3}\b/)
  })

  it('has a way back to the dashboard', async () => {
    const markup = await renderAbout({ name: 'QA Macaria' })

    expect(markup).toContain('href="#/"')
    expect(markup).toContain('Voltar ao dashboard')
  })
})
