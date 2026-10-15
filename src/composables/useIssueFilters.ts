import { computed, ref, type Ref } from 'vue'
import { calculateMetrics } from '../services/calculateMetrics'
import { defaultFilters } from '../services/config'
import { matchesFilters } from '../services/filterIssues'
import { groupByIssueId } from '../services/groupByIssueId'
import type { AuditIssue, Filters, Finding, NonEvaluated } from '../types/domain'

interface AuditedData {
  issues: Ref<AuditIssue[]>
  findings: Ref<Finding[]>
  incomplete: Ref<NonEvaluated[]>
  lastCollected: Ref<string>
}

export function useIssueFilters({ issues, findings, incomplete, lastCollected }: AuditedData) {
  const filters = ref<Filters>({ ...defaultFilters })

  const assignees = computed(() =>
    [...new Set(issues.value.flatMap((issue) => issue.assignees))].sort()
  )
  const findingsByIssueId = computed(() => groupByIssueId(findings.value))
  const incompleteByIssueId = computed(() => groupByIssueId(incomplete.value))

  const filtered = computed(() =>
    issues.value.filter((issue) => {
      const issueFindings = findingsByIssueId.value.get(issue.id) ?? []
      const issueNonEvaluated = incompleteByIssueId.value.get(issue.id) ?? []
      return matchesFilters(
        issue,
        filters.value,
        issueFindings,
        issueNonEvaluated,
        lastCollected.value
      )
    })
  )

  const filteredFindings = computed(() => {
    const filteredIssueIds = new Set(filtered.value.map((issue) => issue.id))
    return findings.value.filter((finding) => filteredIssueIds.has(finding.issueId))
  })

  const metrics = computed(() =>
    calculateMetrics(filtered.value, filteredFindings.value, incomplete.value)
  )

  return { assignees, filtered, filteredFindings, filters, metrics }
}
