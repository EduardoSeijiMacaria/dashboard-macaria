import type { AuditIssue, Filters, Finding, NonEvaluated } from '../types/domain'
import { inInclusiveRange } from './dates'

const withoutAssigneeFilterValue = '__none__'

export function matchesFilters(
  issue: AuditIssue,
  filters: Filters,
  issueFindings: Finding[],
  issueNonEvaluated: NonEvaluated[],
  collectedAt: string
): boolean {
  if (!matchesSearch(issue, filters.query)) return false
  if (!matchesAssignee(issue, filters.assignee)) return false
  if (!matchesCategory(issue, filters.category)) return false
  if (!matchesSeverity(issueFindings, filters.severity)) return false
  if (!matchesView(issueFindings, issueNonEvaluated, filters.view)) return false
  const filterDate = getFilterDate(issue, filters.dateField, collectedAt)
  return inInclusiveRange(filterDate, filters.from, filters.to)
}

function matchesSearch(issue: AuditIssue, query: string): boolean {
  if (!query) return true
  const searchableText = `${issue.number} ${issue.url} ${issue.title}`.toLowerCase()
  return searchableText.includes(query.toLowerCase())
}

function matchesAssignee(issue: AuditIssue, assignee: string): boolean {
  if (!assignee) return true
  if (assignee === withoutAssigneeFilterValue) return issue.assignees.length === 0
  return issue.assignees.includes(assignee)
}

function matchesCategory(issue: AuditIssue, category: Filters['category']): boolean {
  return category === 'all' || issue.category === category
}

function matchesSeverity(issueFindings: Finding[], severity: Filters['severity']): boolean {
  if (severity === 'all') return true
  return issueFindings.some((finding) => finding.severity === severity)
}

function matchesView(
  issueFindings: Finding[],
  issueNonEvaluated: NonEvaluated[],
  view: Filters['view']
): boolean {
  if (view === 'findings') return issueFindings.length > 0
  if (view === 'insufficient') return issueNonEvaluated.length > 0
  return true
}

function getFilterDate(
  issue: AuditIssue,
  dateField: Filters['dateField'],
  collectedAt: string
): string | undefined {
  if (dateField === 'start') return issue.fields.Start?.value
  if (dateField === 'collectedAt') return collectedAt
  return issue[dateField]
}
