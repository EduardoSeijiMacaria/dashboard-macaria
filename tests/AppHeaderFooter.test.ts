import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import AppFooter from '../src/components/AppFooter.vue'
import AppHeader from '../src/components/AppHeader.vue'

interface HeaderProps {
  currentPage: 'dashboard' | 'about'
  connectionStatus: 'checking' | 'connected' | 'disconnected'
  theme: 'light' | 'dark'
  locale: 'pt-BR' | 'en' | 'es'
}

async function renderHeader(overrides: Partial<HeaderProps> = {}): Promise<string> {
  const props: HeaderProps = {
    currentPage: 'dashboard',
    connectionStatus: 'connected',
    theme: 'light',
    locale: 'pt-BR',
    ...overrides
  }
  const app = createSSRApp({ render: () => h(AppHeader, props) })
  return renderToString(app)
}

async function renderFooter(repositoryUrl: string): Promise<string> {
  const app = createSSRApp({ render: () => h(AppFooter, { repositoryUrl }) })
  return renderToString(app)
}

describe('AppHeader', () => {
  it('shows the name as a link to the dashboard, without a long description', async () => {
    const markup = await renderHeader()

    expect(markup).toMatch(/<a [^>]*href="#\/"[^>]*>Macaria QA<\/a>/)
    expect(markup).not.toContain('Consistência de issues')
  })

  it('keeps the connection details out of the header', async () => {
    const markup = await renderHeader()

    expect(markup).not.toContain('Organização')
    expect(markup).not.toContain('Repositório')
    expect(markup).not.toContain('Project')
  })

  it('links to the dashboard and to the About page', async () => {
    const markup = await renderHeader()

    expect(markup).toContain('href="#/"')
    expect(markup).toContain('href="#/sobre"')
  })

  it.each([
    ['dashboard', 'href="#/" aria-current="page"'],
    ['about', 'href="#/sobre" aria-current="page"']
  ] as const)('marks the %s link as the current page', async (currentPage, expectedLink) => {
    const markup = await renderHeader({ currentPage })

    expect(markup).toContain(expectedLink)
  })

  it.each([
    ['connected', '✔ Conectado'],
    ['disconnected', '✖ Desconectado'],
    ['checking', '… Conectando']
  ] as const)('says %s with a text and a symbol, not only color', async (status, expectedText) => {
    const markup = await renderHeader({ connectionStatus: status })

    expect(markup).toContain(expectedText)
  })

  it('has a Settings button with an accessible name, an icon, and a text', async () => {
    const markup = await renderHeader()

    expect(markup).toContain('aria-label="Configurações"')
    expect(markup).toContain('<svg')
    expect(markup).toContain('aria-hidden="true"')
    expect(markup).toMatch(/class="label"[^>]*>Configurações<\/span>/)
  })
})

describe('AppFooter', () => {
  it('shows the discreet text and a link to the configured repository', async () => {
    const markup = await renderFooter('https://github.com/acme/qa-board')

    expect(markup).toContain('Macaria QA — Dashboard de consistência de issues')
    expect(markup).toContain('href="https://github.com/acme/qa-board"')
    expect(markup).toContain('Abrir repositório no GitHub')
    expect(markup).toContain('rel="noopener noreferrer"')
  })

  it('does not link to the About page', async () => {
    const markup = await renderFooter('')

    expect(markup).not.toContain('href="#/sobre"')
  })

  it('shows no repository link when no repository is known', async () => {
    const markup = await renderFooter('')

    expect(markup).toContain('Macaria QA')
    expect(markup).not.toContain('Abrir repositório no GitHub')
  })
})
