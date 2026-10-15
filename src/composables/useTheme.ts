import { ref } from 'vue'

export type Theme = 'light' | 'dark'

const themeStorageKey = 'qa-dashboard-theme'

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

export function readSavedTheme(getStorage: () => Storage): Theme | null {
  try {
    const savedValue = getStorage().getItem(themeStorageKey)
    return isTheme(savedValue) ? savedValue : null
  } catch (error) {
    console.warn('ThemeReadFailed', error)
    return null
  }
}

export function saveTheme(getStorage: () => Storage, theme: Theme) {
  try {
    getStorage().setItem(themeStorageKey, theme)
  } catch (error) {
    console.warn('ThemeSaveFailed', error)
  }
}

export function resolveInitialTheme(savedTheme: Theme | null, systemPrefersDark: boolean): Theme {
  if (savedTheme) return savedTheme
  return systemPrefersDark ? 'dark' : 'light'
}

export function oppositeTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark'
}

const themeTransitionMs = 450

function applyThemeSmoothly(theme: Theme) {
  const root = document.documentElement
  root.classList.add('theme-changing')
  root.dataset.theme = theme
  window.setTimeout(() => root.classList.remove('theme-changing'), themeTransitionMs)
}

export function useTheme() {
  const getBrowserStorage = () => window.localStorage
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const theme = ref<Theme>(
    resolveInitialTheme(readSavedTheme(getBrowserStorage), systemPrefersDark)
  )
  document.documentElement.dataset.theme = theme.value

  function toggleTheme() {
    theme.value = oppositeTheme(theme.value)
    applyThemeSmoothly(theme.value)
    saveTheme(getBrowserStorage, theme.value)
  }

  return { theme, toggleTheme }
}
