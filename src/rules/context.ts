import type { MessageKey } from '../i18n/messageKeys'
import type {
  AuditConfig,
  AuditIssue,
  Finding,
  Localizable,
  MessageRef,
  NonEvaluated,
  RuleConfig
} from '../types/domain'

export interface EvaluationResult {
  findings: Finding[]
  nonEvaluated: NonEvaluated[]
}

export interface RuleContext {
  config: AuditConfig
  issuesById: ReadonlyMap<string, AuditIssue>
  collectedAt: string
  result: EvaluationResult
}

export const titleFieldLabel: MessageRef = { key: 'fields.title' }
export const subtasksFieldLabel: MessageRef = { key: 'fields.subtasks' }

export function getFieldValue(issue: AuditIssue, fieldName: string): string | undefined {
  return issue.fields[fieldName]?.value
}

export type FieldAvailability =
  'available' | 'not-queried' | 'no-access' | 'not-found' | 'outside-project' | 'query-failed'

const availabilityKeys: Record<Exclude<FieldAvailability, 'available'>, MessageKey> = {
  'not-queried': 'availability.not-queried',
  'no-access': 'availability.no-access',
  'not-found': 'availability.not-found',
  'outside-project': 'availability.outside-project',
  'query-failed': 'availability.query-failed'
}

export function getFieldAvailability(issue: AuditIssue, fieldName: string): FieldAvailability {
  const field = issue.fields[fieldName]
  if (!field) return 'not-queried'
  if (field.state === 'unavailable') return 'no-access'
  if (field.state === 'unconfigured') return 'not-found'
  if (field.state === 'outside-project') return 'outside-project'
  if (field.state === 'error') return 'query-failed'
  return 'available'
}

export function describeUnavailableField(issue: AuditIssue, fieldName: string): MessageRef {
  const availability = getFieldAvailability(issue, fieldName)
  if (availability === 'available') throw new Error(`Field ${fieldName} is available`)
  return { key: availabilityKeys[availability] }
}

export function isFieldUnavailable(issue: AuditIssue, fieldName: string): boolean {
  return getFieldAvailability(issue, fieldName) !== 'available'
}

export function isFieldEmpty(issue: AuditIssue, fieldName: string): boolean {
  const field = issue.fields[fieldName]
  if (!field || !['empty', 'value'].includes(field.state)) return false
  return !String(field.value ?? '').trim()
}

export function addFinding(
  context: RuleContext,
  issue: AuditIssue,
  ruleId: string,
  finding: Omit<Finding, 'id' | 'ruleId' | 'ruleVersion' | 'severity' | 'issueId' | 'collectedAt'>
): void {
  const rule = context.config.rules.find((configuredRule) => configuredRule.id === ruleId)
  if (!rule?.enabled) return
  context.result.findings.push(createFinding(issue, rule, ruleId, context.collectedAt, finding))
}

function createFinding(
  issue: AuditIssue,
  rule: RuleConfig,
  ruleId: string,
  collectedAt: string,
  finding: Omit<Finding, 'id' | 'ruleId' | 'ruleVersion' | 'severity' | 'issueId' | 'collectedAt'>
): Finding {
  return {
    id: [issue.id, ruleId, readFieldIdentity(finding.field)].filter(Boolean).join(':'),
    ruleId,
    ruleVersion: rule.version,
    severity: rule.severity,
    issueId: issue.id,
    collectedAt,
    ...finding
  }
}

export function addNonEvaluated(
  context: RuleContext,
  issue: AuditIssue,
  ruleId: string,
  field: Localizable,
  reason: MessageRef
): void {
  context.result.nonEvaluated.push({ issueId: issue.id, ruleId, field, reason })
}

function readFieldIdentity(field?: Localizable): string | undefined {
  if (field === undefined) return undefined
  return typeof field === 'string' ? field : field.key
}
