import type { AuditIssue, Finding, NonEvaluated } from '../types/domain'

export type IssueAuditState = 'problems' | 'not-evaluated' | 'clean'

export function getIssueAuditState(
  issue: AuditIssue,
  issueFindings: Finding[],
  issueNonEvaluated: NonEvaluated[]
): IssueAuditState {
  if (issueFindings.length > 0) return 'problems'
  const isWithoutTaskOrSubtaskRules = issue.category === 'other'
  if (isWithoutTaskOrSubtaskRules || issueNonEvaluated.length > 0) return 'not-evaluated'
  return 'clean'
}
