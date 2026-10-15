import type { AuditIssue, MessageParam } from '../../types/domain'
import { addFinding, type RuleContext } from '../context'

export function evaluateMilestoneRules(issue: AuditIssue, context: RuleContext): void {
  const allowedNames = context.config.allowedMilestoneNames
  const names: MessageParam = { list: allowedNames, kind: 'or' }
  const milestoneTitle = issue.milestone?.trim() ?? ''
  if (milestoneTitle === '') {
    addFinding(context, issue, 'MILESTONE-001', {
      field: 'Milestone',
      explanation: { key: 'rules.milestoneMissing' },
      expected: { key: 'rules.milestoneExpected', params: { names } }
    })
    return
  }
  if (allowedNames.length === 0) return
  const isAllowed = allowedNames.some((name) => isSameName(name, milestoneTitle))
  if (isAllowed) return
  addFinding(context, issue, 'MILESTONE-001', {
    field: 'Milestone',
    current: issue.milestone,
    explanation: { key: 'rules.milestoneInvalid', params: { names } },
    expected: { key: 'rules.milestoneExpected', params: { names } }
  })
}

function isSameName(firstName: string, secondName: string): boolean {
  return firstName.trim().toLowerCase() === secondName.trim().toLowerCase()
}
