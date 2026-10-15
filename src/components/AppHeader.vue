<script setup lang="ts">
import { computed } from 'vue'
import type { ConnectionStatus } from '../composables/useAuditDashboard'
import type { Page } from '../composables/useCurrentPage'
import type { Locale } from '../i18n/locales'
import { t } from '../i18n/translate'
import type { Theme } from '../composables/useTheme'
import AppIcon from './AppIcon.vue'
import LanguageSwitch from './LanguageSwitch.vue'
import ThemeToggle from './ThemeToggle.vue'

const props = defineProps<{
  currentPage: Page
  connectionStatus: ConnectionStatus
  theme: Theme
  locale: Locale
}>()
defineEmits<{ toggleTheme: []; openSettings: []; changeLocale: [locale: Locale] }>()

const connectionText = computed(() => t(`connection.${props.connectionStatus}`))
</script>

<template>
  <header class="app-header">
    <div class="inner">
      <h1 class="brand"><a href="#/">Macaria QA</a></h1>

      <nav class="pages" :aria-label="t('nav.label')">
        <a href="#/" :aria-current="currentPage === 'dashboard' ? 'page' : undefined">{{
          t('nav.dashboard')
        }}</a>
        <a href="#/sobre" :aria-current="currentPage === 'about' ? 'page' : undefined">{{
          t('nav.about')
        }}</a>
      </nav>

      <div class="actions">
        <p :class="['connection', connectionStatus]" role="status">{{ connectionText }}</p>
        <LanguageSwitch :locale="locale" @change="$emit('changeLocale', $event)" />
        <ThemeToggle :theme="theme" @toggle="$emit('toggleTheme')" />
        <button
          type="button"
          class="settings"
          :aria-label="t('settings.open')"
          @click="$emit('openSettings')"
        >
          <AppIcon name="settings" />
          <span class="label">{{ t('settings.open') }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 20px;
  max-width: 1360px;
  margin: 0 auto;
  padding: 6px 20px;
}

.brand {
  font-size: 18px;
  font-weight: 650;
}

.brand a {
  color: var(--text);
  text-decoration: none;
}

.pages {
  display: flex;
  gap: 4px;
}

.pages a {
  padding: 10px 12px;
  border-radius: 6px 6px 0 0;
  color: var(--muted);
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
}

.pages a:hover {
  background: var(--surface-subtle);
  color: var(--text);
}

.pages a[aria-current='page'] {
  box-shadow: inset 0 -3px 0 var(--accent);
  color: var(--text);
  font-weight: 700;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin-left: auto;
}

.connection {
  font-size: 12px;
}

.connection.checking {
  color: var(--muted);
}

.connection.connected {
  color: var(--ok-text);
}

.connection.disconnected {
  color: var(--error-text);
}

.settings {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

@media (max-width: 720px) {
  .inner {
    padding: 6px 16px;
  }

  .settings .label {
    display: none;
  }
}
</style>
