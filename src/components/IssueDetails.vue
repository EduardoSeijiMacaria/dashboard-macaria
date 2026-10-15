<script setup lang="ts">
import { computed } from 'vue'
import { t, translateMessage, translateText } from '../i18n/translate'
import type { AuditIssue, Finding, MessageRef, NonEvaluated } from '../types/domain'
import SeverityBadge from './SeverityBadge.vue'

const props = defineProps<{
  issue: AuditIssue
  findings: Finding[]
  incomplete: NonEvaluated[]
  isBusy: boolean
  isUpdating: boolean
  statusMessage?: MessageRef
}>()
defineEmits<{ update: [] }>()

const classificationText = computed(() => {
  const { category, categoryOrigin } = props.issue
  if (categoryOrigin === 'unclassified') return t('classification.unclassified')
  const name = describeCategory(category)
  const origin =
    categoryOrigin === 'type' ? t('classification.originType') : t('classification.originLabel')
  return t('classification.withOrigin', { name, origin })
})

const updateButtonLabel = computed(() =>
  props.isUpdating ? t('refresh.loading') : t('details.update')
)
const hasNoFindings = computed(() => props.findings.length === 0)

function describeCategory(category: AuditIssue['category']): string {
  if (category === 'task') return 'Task'
  if (category === 'subtask') return 'Subtask'
  return t('classification.other')
}
</script>

<template>
  <section class="details" :aria-label="t('details.aria', { number: issue.number })">
    <div class="head">
      <div class="identity">
        <p class="full-title">{{ issue.title }}</p>
        <p class="classification">{{ t('details.type', { value: classificationText }) }}</p>
      </div>
      <div class="actions">
        <a :href="issue.url" target="_blank" rel="noopener noreferrer">
          {{ t('details.open') }} ↗
        </a>
        <button type="button" :disabled="isBusy" :aria-busy="isUpdating" @click="$emit('update')">
          <span v-if="isUpdating" class="spinner" aria-hidden="true"></span>
          <span>{{ updateButtonLabel }}</span>
        </button>
      </div>
    </div>
    <p class="status-message" role="status">
      {{ statusMessage ? translateMessage(statusMessage) : '' }}
    </p>

    <h3>{{ t('details.findingsTitle', { count: findings.length }) }}</h3>
    <p v-if="hasNoFindings" class="none">{{ t('details.noFindings') }}</p>
    <table v-else>
      <thead>
        <tr>
          <th>{{ t('details.field') }}</th>
          <th>{{ t('details.current') }}</th>
          <th>{{ t('details.expected') }}</th>
          <th>{{ t('details.explanation') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="finding in findings" :key="finding.id">
          <td :data-label="t('details.field')">
            <SeverityBadge :severity="finding.severity" />
            <span class="field">{{ finding.field ? translateText(finding.field) : '' }}</span>
          </td>
          <td :data-label="t('details.current')">{{ finding.current ?? '—' }}</td>
          <td :data-label="t('details.expected')">
            <template v-if="finding.expected || finding.suggestion">
              <span v-if="finding.expected">{{ translateText(finding.expected) }}</span>
              <div v-if="finding.suggestion" class="suggestion">
                {{ t('details.suggestion', { value: finding.suggestion }) }}
              </div>
            </template>
            <template v-else>—</template>
          </td>
          <td :data-label="t('details.explanation')">
            {{ translateMessage(finding.explanation) }}
          </td>
        </tr>
      </tbody>
    </table>

    <template v-if="incomplete.length || issue.category === 'other'">
      <h3>{{ t('details.cannotEvaluate') }}</h3>
      <ul class="not-evaluated">
        <li v-if="issue.category === 'other'">{{ t('details.unclassifiedNotice') }}</li>
        <li v-for="result in incomplete" :key="result.ruleId">
          <strong>{{ result.field ? translateText(result.field) : '' }}</strong>
          — {{ translateMessage(result.reason) }}
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.details {
  display: grid;
  gap: 10px;
  padding: 14px 16px 16px 44px;
}

.head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  justify-content: space-between;
}

.identity {
  min-width: 0;
  max-width: 70ch;
}

.full-title {
  font-weight: 650;
  overflow-wrap: anywhere;
}

.classification,
.status-message {
  color: var(--muted);
  font-size: 13px;
}

.actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

h3 {
  font-size: 13px;
  font-weight: 650;
}

.none {
  color: var(--ok-text);
}

table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface);
}

th {
  padding: 6px 10px;
  border-bottom: 1px solid var(--border-strong);
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  text-align: left;
}

td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
  overflow-wrap: anywhere;
}

td:nth-child(1) {
  width: 20%;
}

td:nth-child(2),
td:nth-child(3) {
  width: 24%;
}

.field,
.suggestion {
  display: block;
  margin-top: 2px;
  color: var(--muted);
  font-size: 13px;
}

.not-evaluated {
  display: grid;
  gap: 4px;
  margin: 0;
  padding-left: 18px;
}

@media (max-width: 720px) {
  .details {
    padding: 12px;
  }

  thead {
    display: none;
  }

  table,
  tbody,
  tr,
  td {
    display: block;
  }

  tr {
    border-bottom: 1px solid var(--border-strong);
  }

  td,
  td:nth-child(n) {
    width: auto;
    border: 0;
  }

  td::before {
    display: block;
    color: var(--muted);
    font-size: 11px;
    content: attr(data-label);
  }
}
</style>
