import type { AuditIssue } from '../../types/domain'
import { addFinding, titleFieldLabel, type RuleContext } from '../context'

export function evaluateSubtaskRules(issue: AuditIssue, context: RuleContext): void {
  const title = issue.title
  const malformedMarker = !/^\[MACARIA\]/.test(title)
  const singularScenario = /Scenario (generation|execution)/.test(title)
  if (malformedMarker)
    addFinding(context, issue, 'SUB-001', {
      explanation: { key: 'rules.subMarker' },
      field: titleFieldLabel,
      current: title,
      suggestion: title.replace(/^\[MACARIA[}\]]?/, '[MACARIA]')
    })
  if (title !== title.trim() || /^\[MACARIA\]-(?! )/.test(title))
    addFinding(context, issue, 'SUB-002', {
      explanation: { key: 'rules.subSpacing' },
      field: titleFieldLabel,
      current: title,
      expected: '[MACARIA] - ...'
    })
  if (singularScenario)
    addFinding(context, issue, 'SUB-003', {
      explanation: { key: 'rules.subScenarios' },
      field: titleFieldLabel,
      current: title,
      suggestion: title.replace(/Scenario (generation|execution)/, 'Scenarios $1')
    })
  if (!isValidSubtaskTitle(title, context) && !malformedMarker && !singularScenario)
    addFinding(context, issue, 'SUB-004', {
      explanation: { key: 'rules.subFormat' },
      field: titleFieldLabel,
      current: title
    })
}

function isValidSubtaskTitle(title: string, context: RuleContext): boolean {
  const keys = context.config.subtaskKeys.join('|')
  const pattern = new RegExp(
    `^\\[MACARIA\\] - (Scenarios (generation|execution|regression) - .+|Regression \\d{4}-\\d{2}-\\d{2}|(${keys})-\\d+)$`
  )
  return pattern.test(title.trim())
}
