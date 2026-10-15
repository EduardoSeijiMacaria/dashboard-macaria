import { onMounted, onUnmounted, ref } from 'vue'

export type Page = 'dashboard' | 'about'

const aboutPageHash = '#/sobre'

export function readPageFromHash(hash: string): Page {
  return hash === aboutPageHash ? 'about' : 'dashboard'
}

export function useCurrentPage() {
  const currentPage = ref<Page>(readPageFromHash(window.location.hash))

  function showPageOfCurrentHash(): void {
    currentPage.value = readPageFromHash(window.location.hash)
    window.scrollTo(0, 0)
  }

  onMounted(() => window.addEventListener('hashchange', showPageOfCurrentHash))
  onUnmounted(() => window.removeEventListener('hashchange', showPageOfCurrentHash))

  return { currentPage }
}
