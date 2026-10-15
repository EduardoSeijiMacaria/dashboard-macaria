<script setup lang="ts">
import { computed } from 'vue'
import { getActiveLocale } from '../i18n'
import { t } from '../i18n/translate'
import { formatDateTime } from '../services/dates'

const props = defineProps<{ lastCollected: string; isLoading: boolean; isUpdatingIssue: boolean }>()
defineEmits<{ refresh: []; cancel: [] }>()

const refreshButtonLabel = computed(() =>
  props.isLoading ? t('refresh.loading') : t('refresh.button')
)
const isBusy = computed(() => props.isLoading || props.isUpdatingIssue)
const lastUpdateText = computed(() => {
  if (!props.lastCollected) return t('refresh.never')
  return t('refresh.lastUpdate', { date: formatDateTime(props.lastCollected, getActiveLocale()) })
})
</script>

<template>
  <div class="refresh">
    <p class="last-update">{{ lastUpdateText }}</p>
    <button v-if="isBusy" type="button" @click="$emit('cancel')">{{ t('refresh.cancel') }}</button>
    <button
      type="button"
      class="primary"
      :disabled="isBusy"
      :aria-busy="isLoading"
      @click="$emit('refresh')"
    >
      <span v-if="isLoading" class="spinner" aria-hidden="true"></span>
      <span>{{ refreshButtonLabel }}</span>
    </button>
  </div>
</template>

<style scoped>
.refresh {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: center;
}

.last-update {
  color: var(--muted);
  font-size: 12px;
}
</style>
