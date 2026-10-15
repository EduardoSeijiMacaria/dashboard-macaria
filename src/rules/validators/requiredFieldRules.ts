import type { AuditIssue, MessageRef, RequiredFieldConfig } from '../../types/domain'
import {
  addFinding,
  addNonEvaluated,
  describeUnavailableField,
  getFieldValue,
  isFieldEmpty,
  isFieldUnavailable,
  type RuleContext
} from '../context'

const statusFieldName = 'Status'

export function evaluateRequiredFieldRules(issue: AuditIssue, context: RuleContext): void {
  evaluateRequiredFields(issue, context)
  evaluateStartWhenStatusIsNotOptional(issue, context)
}

function evaluateRequiredFields(issue: AuditIssue, context: RuleContext): void {
  const requiredFields = context.config.requiredFields
  const unavailableFields = requiredFields.filter((field) => isFieldUnavailable(issue, field.name))
  if (unavailableFields.length > 0) {
    const reason = describeUnavailableFields(issue, unavailableFields)
    addNonEvaluated(context, issue, 'FIELD-001', { key: 'notEvaluated.requiredFields' }, reason)
  }
  for (const field of requiredFields) {
    if (isFieldEmpty(issue, field.name)) addEmptyFieldFinding(issue, field, context)
  }
}

function describeUnavailableFields(issue: AuditIssue, fields: RequiredFieldConfig[]): MessageRef {
  const descriptions = fields.map((field) => ({
    key: 'notEvaluated.fieldWithState' as const,
    params: { name: field.name, state: describeUnavailableField(issue, field.name) }
  }))
  return {
    key: 'notEvaluated.cannotRead',
    params: { fields: { list: descriptions, kind: 'comma' } }
  }
}

function addEmptyFieldFinding(
  issue: AuditIssue,
  field: RequiredFieldConfig,
  context: RuleContext
): void {
  addFinding(context, issue, 'FIELD-001', {
    field: field.name,
    explanation: { key: field.emptyMessageKey ?? 'rules.requiredField' },
    expected: { key: field.expectedKey ?? 'rules.requiredFieldExpected' }
  })
}

function evaluateStartWhenStatusIsNotOptional(issue: AuditIssue, context: RuleContext): void {
  const { fieldName: startName, optionalWhileStatus } = context.config.startDate
  const unknownStatusReason = describeUnknownStatus(issue, optionalWhileStatus)
  if (unknownStatusReason) {
    addNonEvaluated(context, issue, 'FIELD-002', startName, unknownStatusReason)
    return
  }
  const status = getFieldValue(issue, statusFieldName) ?? ''
  const isStartOptional = status.trim().toLowerCase() === optionalWhileStatus.trim().toLowerCase()
  if (isStartOptional) return
  if (isFieldUnavailable(issue, startName)) {
    const reason: MessageRef = {
      key: 'notEvaluated.startUnavailable',
      params: { field: startName, state: describeUnavailableField(issue, startName) }
    }
    addNonEvaluated(context, issue, 'FIELD-002', startName, reason)
    return
  }
  if (!isFieldEmpty(issue, startName)) return
  addFinding(context, issue, 'FIELD-002', {
    field: startName,
    explanation: {
      key: 'rules.startRequired',
      params: { statusField: statusFieldName, optionalStatus: optionalWhileStatus }
    },
    expected: { key: 'rules.startExpected', params: { field: startName } }
  })
}

function describeUnknownStatus(
  issue: AuditIssue,
  optionalWhileStatus: string
): MessageRef | undefined {
  if (isFieldUnavailable(issue, statusFieldName)) {
    return {
      key: 'notEvaluated.statusUnknown',
      params: {
        statusField: statusFieldName,
        state: describeUnavailableField(issue, statusFieldName),
        optionalStatus: optionalWhileStatus
      }
    }
  }
  if (isFieldEmpty(issue, statusFieldName)) {
    return {
      key: 'notEvaluated.statusEmpty',
      params: { statusField: statusFieldName, optionalStatus: optionalWhileStatus }
    }
  }
  return undefined
}
