<script setup lang="ts">
import { t, translateText } from '../i18n/translate'
import type { Localizable } from '../types/domain'

defineProps<{ organizationName: string; repositoryName: string; projectLabel: Localizable }>()
</script>

<template>
  <dl v-if="organizationName" class="connection-summary" :aria-label="t('sourceLabel')">
    <div>
      <dt>{{ t('labels.organization') }}</dt>
      <dd>{{ organizationName }}</dd>
    </div>
    <div>
      <dt>{{ t('labels.repository') }}</dt>
      <dd>{{ repositoryName }}</dd>
    </div>
    <div>
      <dt>{{ t('labels.project') }}</dt>
      <dd>{{ translateText(projectLabel) }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.connection-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 20px;
  margin: 0;
  font-size: 13px;
}

div {
  display: flex;
  gap: 6px;
  min-width: 0;
}

dt {
  color: var(--muted);
}

dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  font-weight: 600;
}
</style>
