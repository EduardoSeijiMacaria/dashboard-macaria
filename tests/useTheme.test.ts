import { describe, expect, it, vi } from 'vitest'
import {
  oppositeTheme,
  readSavedTheme,
  resolveInitialTheme,
  saveTheme
} from '../src/composables/useTheme'

function createMemoryStorage(initialEntries: Record<string, string> = {}) {
  const entries = { ...initialEntries }
  return {
    getItem: (key: string) => entries[key] ?? null,
    setItem: (key: string, value: string) => {
      entries[key] = value
    }
  } as Storage
}

function createBlockedStorage(): Storage {
  throw new Error('storage blocked')
}

describe('theme choice', () => {
  it.each([
    [null, true, 'dark'],
    [null, false, 'light'],
    ['light', true, 'light'],
    ['dark', false, 'dark']
  ] as const)(
    'saved %s with system dark %s resolves to %s',
    (savedTheme, systemPrefersDark, expectedTheme) => {
      expect(resolveInitialTheme(savedTheme, systemPrefersDark)).toBe(expectedTheme)
    }
  )

  it('reads back a theme that was saved', () => {
    const storage = createMemoryStorage()
    saveTheme(() => storage, 'dark')
    expect(readSavedTheme(() => storage)).toBe('dark')
  })

  it('ignores a saved value that is not a theme', () => {
    const storage = createMemoryStorage({ 'qa-dashboard-theme': 'purple' })
    expect(readSavedTheme(() => storage)).toBeNull()
  })

  it('works when storage is blocked', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(readSavedTheme(createBlockedStorage)).toBeNull()
    expect(() => saveTheme(createBlockedStorage, 'dark')).not.toThrow()
    expect(warnSpy).toHaveBeenCalledTimes(2)
    warnSpy.mockRestore()
  })

  it('switches to the opposite theme', () => {
    expect(oppositeTheme('light')).toBe('dark')
    expect(oppositeTheme('dark')).toBe('light')
  })
})
