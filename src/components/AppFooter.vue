<script setup lang="ts">
import { t } from '../i18n/translate'

defineProps<{ repositoryUrl: string }>()
</script>

<template>
  <footer class="app-footer">
    <div class="inner">
      <p>{{ t('footer.text') }}</p>
      <nav class="links" :aria-label="t('footer.label')">
        <a v-if="repositoryUrl" :href="repositoryUrl" target="_blank" rel="noopener noreferrer">
          {{ t('footer.openRepository') }} ↗
        </a>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: 13px;
}

.inner {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px 24px;
  max-width: 1360px;
  margin: 0 auto;
  padding: 12px 20px;
}

nav.links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
}

@media (max-width: 720px) {
  .inner {
    padding: 12px 16px;
  }
}
</style>
