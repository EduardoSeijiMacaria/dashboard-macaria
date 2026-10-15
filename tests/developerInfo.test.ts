import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { developerInfo, findUsableContact } from '../src/services/developerInfo'

describe('developerInfo', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('credits QA Macaria and offers the e-mail the team gave', () => {
    expect(developerInfo.name).toBe('QA Macaria')
    expect(developerInfo.contact).toEqual({
      name: 'e-mail',
      url: 'mailto:eduardo.castro@frenet.com.br',
      display: 'eduardo.castro@frenet.com.br'
    })
  })

  it('accepts the configured contact', () => {
    expect(findUsableContact(developerInfo)).toEqual(developerInfo.contact)
  })

  it('finds no contact when none is configured', () => {
    expect(findUsableContact({ name: 'QA Macaria' })).toBeUndefined()
  })

  it.each([
    ['https link', 'https://example.test/contato'],
    ['mailto link', 'mailto:qa@example.test']
  ])('accepts a %s', (_caseName, url) => {
    const contact = { name: 'Canal', url }

    expect(findUsableContact({ name: 'QA Macaria', contact })).toEqual(contact)
  })

  it.each([
    ['javascript link', 'javascript:alert(1)'],
    ['plain http link', 'http://example.test'],
    ['text that is not a link', 'não é um link'],
    ['empty text', '']
  ])('rejects a %s and logs it', (_caseName, url) => {
    const developer = { name: 'QA Macaria', contact: { name: 'Canal', url } }

    expect(findUsableContact(developer)).toBeUndefined()
    expect(console.error).toHaveBeenCalledWith('ContactUrlRejected', 'Canal')
  })
})
