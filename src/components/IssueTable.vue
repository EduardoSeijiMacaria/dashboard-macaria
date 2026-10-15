<script setup lang="ts">
import { computed } from 'vue'
import { t } from '../i18n/translate'
import { getIssueAuditState, type IssueAuditState } from '../services/issueAuditState'
import { groupByIssueId } from '../services/groupByIssueId'
import type { AuditIssue, Finding, NonEvaluated } from '../types/domain'
import SeverityBadge from './SeverityBadge.vue'

interface IssueRow {
  issue: AuditIssue
  issueFindings: Finding[]
  issueNonEvaluated: NonEvaluated[]
  auditState: IssueAuditState
  errorCountLabel: string
  warningCountLabel: string
  projectStatusText: string
  hasProjectStatus: boolean
}

const props = defineProps<{
  issues: AuditIssue[]
  findings: Finding[]
  incomplete: NonEvaluated[]
  selectedIssueId?: string
}>()
defineEmits<{ select: [issue: AuditIssue] }>()

const rows = computed<IssueRow[]>(() => {
  const findingsByIssueId = groupByIssueId(props.findings)
  const incompleteByIssueId = groupByIssueId(props.incomplete)
  return props.issues.map((issue) => {
    const issueFindings = findingsByIssueId.get(issue.id) ?? []
    const issueNonEvaluated = incompleteByIssueId.get(issue.id) ?? []
    return {
      issue,
      issueFindings,
      issueNonEvaluated,
      auditState: getIssueAuditState(issue, issueFindings, issueNonEvaluated),
      errorCountLabel: describeSeverityCount(issueFindings, 'error'),
      warningCountLabel: describeSeverityCount(issueFindings, 'warning'),
      projectStatusText: describeProjectStatus(issue),
      hasProjectStatus: Boolean(issue.fields.Status?.value)
    }
  })
})

function describeProjectStatus(issue: AuditIssue): string {
  const status = issue.fields.Status
  if (status?.value) return status.value
  if (status?.state === 'empty') return t('table.statusEmpty')
  return t('table.statusNotEvaluated')
}

function describeSeverityCount(issueFindings: Finding[], severity: 'error' | 'warning'): string {
  const count = issueFindings.filter((finding) => finding.severity === severity).length
  if (count === 0) return ''
  const countKey = severity === 'error' ? 'table.errorCount' : 'table.warningCount'
  return t(countKey, { count }, count)
}
</script>

<template>
  <table>
    <caption class="visually-hidden">
      {{
        t('table.caption')
      }}
    </caption>
    <thead>
      <tr>
        <th class="number">{{ t('table.number') }}</th>
        <th>{{ t('table.title') }}</th>
        <th class="assignee">{{ t('table.assignee') }}</th>
        <th class="status">{{ t('table.projectStatus') }}</th>
        <th class="problems">{{ t('table.problems') }}</th>
      </tr>
    </thead>
    <tbody>
      <template v-for="row in rows" :key="row.issue.id">
        <tr :class="{ open: row.issue.id === selectedIssueId }">
          <td class="number" :data-label="t('table.number')">#{{ row.issue.number }}</td>
          <td class="title">
            <button
              type="button"
              :title="row.issue.title"
              :aria-expanded="row.issue.id === selectedIssueId"
              :aria-controls="`details-${row.issue.number}`"
              @click="$emit('select', row.issue)"
            >
              <span aria-hidden="true">{{ row.issue.id === selectedIssueId ? '▾' : '▸' }}</span>
              <span class="title-text">{{ row.issue.title }}</span>
            </button>
          </td>
          <td class="assignee" :data-label="t('table.assignee')">
            <template v-if="row.issue.assignees.length">{{
              row.issue.assignees.join(', ')
            }}</template>
            <span v-else class="muted">{{ t('filters.noAssignee') }}</span>
          </td>
          <td class="status" :data-label="t('table.projectStatus')">
            <span :class="{ muted: !row.hasProjectStatus }">{{ row.projectStatusText }}</span>
          </td>
          <td class="problems" :data-label="t('table.problems')">
            <template v-if="row.auditState === 'problems'">
              <SeverityBadge
                v-if="row.errorCountLabel"
                severity="error"
                :label="row.errorCountLabel"
              />
              <SeverityBadge
                v-if="row.warningCountLabel"
                severity="warning"
                :label="row.warningCountLabel"
              />
            </template>
            <SeverityBadge
              v-else-if="row.auditState === 'not-evaluated'"
              severity="info"
              :label="t('table.notEvaluated')"
            />
            <span v-else class="badge ok"
              ><span aria-hidden="true">✔</span> {{ t('table.noProblems') }}</span
            >
          </td>
        </tr>
        <tr v-if="row.issue.id === selectedIssueId" class="details">
          <td :id="`details-${row.issue.number}`" colspan="5">
            <slot
              name="details"
              :issue="row.issue"
              :issue-findings="row.issueFindings"
              :issue-non-evaluated="row.issueNonEvaluated"
            />
          </td>
        </tr>
      </template>
    </tbody>
  </table>
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-strong);
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  text-align: left;
}

td {
  padding: 6px 12px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.number {
  width: 72px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.assignee {
  width: 18%;
  overflow-wrap: anywhere;
}

.status {
  width: 14%;
}

.problems {
  width: 190px;
}

.muted {
  color: var(--muted);
}

.title {
  padding: 0;
}

.title button {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  min-height: 40px;
  padding: 0 12px;
  border: 0;
  border-radius: 0;
  background: none;
  text-align: left;
}

.title button:hover:not(:disabled) {
  background: none;
}

.title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

tbody tr:not(.details):hover,
tr.open {
  background: var(--row-hover);
}

tr.open {
  background: var(--row-open);
}

tr.details > td {
  padding: 0;
  background: var(--surface-subtle);
}

.problems :deep(.badge) {
  margin-right: 4px;
}

@media (max-width: 720px) {
  table,
  tbody,
  tr,
  td {
    display: block;
  }

  thead {
    display: none;
  }

  tr:not(.details) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px 12px;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
  }

  td {
    padding: 2px 12px;
    border: 0;
  }

  td::before {
    display: block;
    color: var(--muted);
    font-size: 11px;
    content: attr(data-label);
  }

  td.title {
    grid-column: 1 / -1;
    order: -1;
  }

  td.title::before {
    content: none;
  }

  .number,
  .assignee,
  .status,
  .problems {
    width: auto;
  }
}
</style>
