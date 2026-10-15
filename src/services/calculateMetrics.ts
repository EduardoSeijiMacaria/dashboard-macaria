import type { AuditIssue, Finding, NonEvaluated } from '../types/domain'

export interface AuditMetrics {
  total: number
  errors: number
  warnings: number
  clean: number
  partial: number
  findings: number
}

export function calculateMetrics(
  issues: AuditIssue[],
  findings: Finding[],
  nonEvaluated: NonEvaluated[]
): AuditMetrics {
  const issueIds = new Set(issues.map((issue) => issue.id))
  const issueIdsWithError = collectIssueIds(
    findings.filter((finding) => finding.severity === 'error')
  )
  const issueIdsWithFinding = collectIssueIds(findings)
  const issueIdsWithWarningOnly = collectIssueIds(
    findings.filter(
      (finding) => finding.severity === 'warning' && !issueIdsWithError.has(finding.issueId)
    )
  )
  const issueIdsPartiallyEvaluated = collectIssueIds(
    nonEvaluated.filter((result) => issueIds.has(result.issueId))
  )
  const cleanIssues = issues.filter(
    (issue) =>
      issue.category !== 'other' &&
      !issueIdsWithFinding.has(issue.id) &&
      !issueIdsPartiallyEvaluated.has(issue.id)
  )
  return {
    total: issueIds.size,
    errors: issueIdsWithError.size,
    warnings: issueIdsWithWarningOnly.size,
    clean: cleanIssues.length,
    partial: issueIdsPartiallyEvaluated.size,
    findings: findings.length
  }
}

function collectIssueIds(items: Array<{ issueId: string }>): Set<string> {
  return new Set(items.map((item) => item.issueId))
}
