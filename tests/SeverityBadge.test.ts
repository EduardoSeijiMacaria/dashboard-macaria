import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import SeverityBadge from '../src/components/SeverityBadge.vue'

async function renderBadge(props: {
  severity: 'error' | 'warning' | 'info'
  label?: string
}): Promise<string> {
  const app = createSSRApp({ render: () => h(SeverityBadge, props) })
  return renderToString(app)
}

describe('SeverityBadge', () => {
  it.each([
    ['error', 'erro', '✖'],
    ['warning', 'aviso', '▲'],
    ['info', 'info', 'ℹ']
  ] as const)(
    'shows the %s label with a hidden icon, so color is never the only signal',
    async (severity, expectedLabel, expectedIcon) => {
      const markup = await renderBadge({ severity })

      expect(markup).toContain(expectedLabel)
      expect(markup).toContain(`<span aria-hidden="true">${expectedIcon}</span>`)
      expect(markup).toContain(`badge ${severity}`)
    }
  )

  it('shows the given label in place of the severity name', async () => {
    const markup = await renderBadge({ severity: 'info', label: 'Não avaliada' })

    expect(markup).toContain('Não avaliada')
  })
})
