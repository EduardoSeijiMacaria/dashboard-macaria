import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import ConnectionSummary from '../src/components/ConnectionSummary.vue'
import SettingsPanel from '../src/components/SettingsPanel.vue'

interface PanelProps {
  isOpen: boolean
  organizationName: string
  repositoryName: string
  projectLabel: string
  projectFailure?: { key: 'errors.project403' }
  isTokenConfigured: boolean
}

async function renderPanel(overrides: Partial<PanelProps> = {}): Promise<string> {
  const props: PanelProps = {
    isOpen: false,
    organizationName: 'acme',
    repositoryName: 'qa-board',
    projectLabel: '#3',
    isTokenConfigured: true,
    ...overrides
  }
  const app = createSSRApp({ render: () => h(SettingsPanel, props) })
  return renderToString(app)
}

describe('SettingsPanel', () => {
  it('is a labeled dialog that stays closed until it is opened', async () => {
    const markup = await renderPanel()

    expect(markup).toContain('<dialog')
    expect(markup).toContain('aria-labelledby="settings-title"')
    expect(markup).not.toContain('<dialog open')
  })

  it('shows the organization, the repository, the Project, and the token state', async () => {
    const markup = await renderPanel()

    expect(markup).toContain('acme')
    expect(markup).toContain('qa-board')
    expect(markup).toContain('#3')
    expect(markup).toContain('✔ Configurado')
  })

  it('never shows a token value and has no field to type one', async () => {
    const markup = await renderPanel()

    expect(markup).not.toContain('<input')
    expect(markup).not.toContain('type="password"')
  })

  it('says the token is missing when it is not configured', async () => {
    const markup = await renderPanel({ isTokenConfigured: false })

    expect(markup).toContain('✖ Ausente')
  })

  it('shows the reason when the Project call failed', async () => {
    const markup = await renderPanel({ projectFailure: { key: 'errors.project403' } })

    expect(markup).toContain('role="alert"')
    expect(markup).toContain('403: O GitHub negou o acesso ao Project')
  })

  it('offers a button to close the panel with an accessible name', async () => {
    const markup = await renderPanel()

    expect(markup).toContain('aria-label="Fechar configurações"')
  })

  it('says where the values come from, and that it only reads from GitHub', async () => {
    const markup = await renderPanel()

    expect(markup).toContain('arquivo .env')
    expect(markup).toContain('só lê dados do GitHub')
  })
})

describe('ConnectionSummary', () => {
  async function renderSummary(organizationName: string): Promise<string> {
    const app = createSSRApp({
      render: () =>
        h(ConnectionSummary, { organizationName, repositoryName: 'qa-board', projectLabel: '#3' })
    })
    return renderToString(app)
  }

  it('shows the organization, the repository, and the Project in one compact list', async () => {
    const markup = await renderSummary('acme')

    for (const text of ['Organização', 'acme', 'Repositório', 'qa-board', 'Project', '#3']) {
      expect(markup).toContain(text)
    }
  })

  it('shows nothing before the connection is known', async () => {
    const markup = await renderSummary('')

    expect(markup).not.toContain('Organização')
  })
})
