<script setup lang="ts">
import { localeCodes, localeNames, supportedLocales, type Locale } from '../i18n/locales'
import { t } from '../i18n/translate'

defineProps<{ locale: Locale }>()
defineEmits<{ change: [locale: Locale] }>()
</script>

<template>
  <div class="language-switch" role="group" :aria-label="t('language.label')">
    <button
      v-for="option in supportedLocales"
      :key="option"
      type="button"
      :lang="option"
      :title="localeNames[option]"
      :aria-label="localeNames[option]"
      :aria-pressed="option === locale"
      @click="$emit('change', option)"
    >
      {{ localeCodes[option] }}
    </button>
  </div>
</template>

<style scoped>
.language-switch {
  display: inline-flex;
}

button {
  min-width: 36px;
  padding: 0 8px;
  border-radius: 0;
  font-size: 13px;
  font-weight: 600;
}

button + button {
  margin-left: -1px;
}

button:first-child {
  border-radius: 6px 0 0 6px;
}

button:last-child {
  border-radius: 0 6px 6px 0;
}

button[aria-pressed='true'] {
  position: relative;
  border-color: var(--accent);
  background: var(--accent);
  color: var(--on-accent);
}

button[aria-pressed='true']:hover:not(:disabled) {
  background: var(--accent-hover);
}
</style>
