import { describe, expect, it } from 'vitest'
import { readPageFromHash } from '../src/composables/useCurrentPage'

describe('readPageFromHash', () => {
  it.each([
    ['#/sobre', 'about'],
    ['#/', 'dashboard'],
    ['', 'dashboard'],
    ['#/pagina-que-nao-existe', 'dashboard'],
    ['#/sobre/extra', 'dashboard']
  ])('reads %j as the %s page', (hash, expectedPage) => {
    expect(readPageFromHash(hash)).toBe(expectedPage)
  })
})
