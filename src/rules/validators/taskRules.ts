import type { AuditIssue } from '../../types/domain'
import {
  addFinding,
  getFieldValue,
  subtasksFieldLabel,
  titleFieldLabel,
  type RuleContext
} from '../context'

const statusFieldName = 'Status'
const doneStatus = 'Done'

export function evaluateTaskRules(issue: AuditIssue, context: RuleContext): void {
  evaluateTaskTitle(issue, context)
  evaluateRequiredChildren(issue, context)
  evaluateCompletedChildren(issue, context)
}

function evaluateTaskTitle(issue: AuditIssue, context: RuleContext): void {
  const titleMatch = createTaskTitlePattern(context).exec(issue.title)
  if (!titleMatch) {
    addFinding(context, issue, 'TASK-001', {
      explanation: { key: 'rules.taskTitleFormat' },
      field: titleFieldLabel,
      current: issue.title,
      expected: { key: 'rules.taskTitleFormatExpected' }
    })
  }
  if (!titleMatch || !isCalendarDate(titleMatch[2])) {
    addFinding(context, issue, 'TASK-002', {
      explanation: { key: 'rules.taskDateInvalid' },
      field: titleFieldLabel,
      current: issue.title,
      expected: { key: 'rules.taskDateExpected' }
    })
  }
}

function evaluateRequiredChildren(issue: AuditIssue, context: RuleContext): void {
  if (issue.childIds.length === 0) {
    addFinding(context, issue, 'TASK-004', {
      explanation: { key: 'rules.requiredChildren' },
      field: subtasksFieldLabel,
      expected: { key: 'rules.requiredChildrenExpected' }
    })
  }
}

function evaluateCompletedChildren(issue: AuditIssue, context: RuleContext): void {
  const children = issue.childIds
    .map((childId) => context.issuesById.get(childId))
    .filter((child): child is AuditIssue => Boolean(child))
  const allChildrenCompleted =
    children.length > 0 && children.every((child) => isChildCompleted(child, context))
  if (allChildrenCompleted && getFieldValue(issue, statusFieldName) !== doneStatus) {
    addFinding(context, issue, 'TASK-005', {
      explanation: { key: 'rules.childrenDone', params: { done: doneStatus } },
      field: statusFieldName,
      current: getFieldValue(issue, statusFieldName),
      expected: doneStatus
    })
  }
}

function createTaskTitlePattern(context: RuleContext): RegExp {
  const prefixes = context.config.taskPrefixes.map(escapeRegularExpression).join('|')
  return new RegExp(`^(${prefixes}) \\| .+ (\\d{4}-\\d{2}-\\d{2})$`)
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isCalendarDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`))
}

function isChildCompleted(issue: AuditIssue, context: RuleContext): boolean {
  if (context.config.completedBy === 'closed') return issue.state === 'closed'
  return context.config.completedStatuses.includes(getFieldValue(issue, statusFieldName) ?? '')
}
