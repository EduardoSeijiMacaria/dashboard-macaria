<script setup lang="ts">
import { formatNumber, t } from '../i18n/translate'

defineProps<{ analyzedCount: number; issuesWithProblemsCount: number; findingsCount: number }>()
</script>

<template>
  <dl class="summary" :aria-label="t('summary.label')">
    <div>
      <dt>{{ t('summary.analyzed') }}</dt>
      <dd>{{ formatNumber(analyzedCount) }}</dd>
    </div>
    <div>
      <dt>{{ t('summary.withProblems') }}</dt>
      <dd>{{ formatNumber(issuesWithProblemsCount) }}</dd>
    </div>
    <div>
      <dt>{{ t('summary.findings') }}</dt>
      <dd>{{ formatNumber(findingsCount) }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 24px;
  margin: 0;
  color: var(--muted);
}

.summary div {
  display: flex;
  gap: 6px;
}

dd {
  color: var(--text);
  font-weight: 650;
}
</style>
