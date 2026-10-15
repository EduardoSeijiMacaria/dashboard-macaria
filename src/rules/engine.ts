import type { AuditConfig, AuditIssue } from '../types/domain'
import type { EvaluationResult, RuleContext } from './context'
import { evaluateFieldRules, evaluateSiblingFeatureFlags } from './validators/fieldRules'
import { evaluateMilestoneRules } from './validators/milestoneRules'
import { evaluateRequiredFieldRules } from './validators/requiredFieldRules'
import { evaluateSubtaskRules } from './validators/subtaskRules'
import { evaluateTaskRules } from './validators/taskRules'

export function evaluate(
  issues: AuditIssue[],
  config: AuditConfig,
  collectedAt = new Date().toISOString()
): EvaluationResult {
  const context = createRuleContext(issues, config, collectedAt)
  for (const issue of issues) evaluateIssue(issue, context)
  for (const issue of issues) evaluateSiblingFeatureFlags(issue, context)
  return context.result
}

function createRuleContext(
  issues: AuditIssue[],
  config: AuditConfig,
  collectedAt: string
): RuleContext {
  return {
    config,
    issuesById: new Map(issues.map((issue) => [issue.id, issue])),
    collectedAt,
    result: { findings: [], nonEvaluated: [] }
  }
}

function evaluateIssue(issue: AuditIssue, context: RuleContext): void {
  if (issue.category === 'task') evaluateTaskRules(issue, context)
  if (issue.category === 'subtask') evaluateSubtaskRules(issue, context)
  evaluateMilestoneRules(issue, context)
  evaluateFieldRules(issue, context)
  evaluateRequiredFieldRules(issue, context)
}
