import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const environment: Record<string, string> =
    mode === 'test' ? {} : loadEnv(mode, process.cwd(), '')
  return {
    base: process.env.GITHUB_PAGES === 'true' ? './' : '/',
    plugins: [vue()],
    define: {
      __GIT_TOKEN__: JSON.stringify(environment.GIT_TOKEN ?? ''),
      __REPOSITORY_URL__: JSON.stringify(environment.REPOSITORY_URL ?? ''),
      __PROJECT_NUMBER__: JSON.stringify(environment.PROJECT_NUMBER ?? ''),
      __VUE_I18N_FULL_INSTALL__: false,
      __VUE_I18N_LEGACY_API__: false,
      __INTLIFY_PROD_DEVTOOLS__: false
    }
  }
})
