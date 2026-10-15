import type { MessageKey } from '../i18n/messageKeys'

export interface MessageRef {
  key: MessageKey
  params?: Record<string, MessageParam>
}
export type MessageParam =
  string | number | MessageRef | { list: MessageParam[]; kind: 'or' | 'comma' }
export type Localizable = string | MessageRef
export type Severity = 'error' | 'warning' | 'info'
export type Category = 'task' | 'subtask' | 'other'
export type ClassificationOrigin = 'type' | 'label' | 'unclassified'
export interface ClassificationConfig {
  taskTypeName: string
  subtaskTypeName: string
  taskLabelName: string
  subtaskLabelName: string
}
export interface RequiredFieldConfig {
  name: string
  emptyMessageKey?: MessageKey
  expectedKey?: MessageKey
}
export interface StartDateConfig {
  fieldName: string
  optionalWhileStatus: string
}
export type FieldState =
  'value' | 'empty' | 'unavailable' | 'unconfigured' | 'outside-project' | 'error'
export interface ProjectValue {
  state: FieldState
  value?: string
  raw?: unknown
}
export interface AuditIssue {
  id: string
  number: number
  url: string
  title: string
  body?: string
  state: 'open' | 'closed'
  assignees: string[]
  labels: string[]
  milestone?: string
  category: Category
  categoryOrigin: ClassificationOrigin
  createdAt: string
  updatedAt: string
  closedAt?: string
  parentId?: string
  childIds: string[]
  projectItemId?: string
  fields: Record<string, ProjectValue>
}
export interface Finding {
  id: string
  ruleId: string
  ruleVersion: string
  severity: Severity
  issueId: string
  field?: Localizable
  current?: string
  expected?: Localizable
  explanation: MessageRef
  suggestion?: string
  related?: { issueId: string; value: string }[]
  collectedAt: string
}
export interface NonEvaluated {
  issueId: string
  ruleId: string
  field?: Localizable
  reason: MessageRef
}
export interface RuleConfig {
  id: string
  enabled: boolean
  severity: Severity
  version: string
  provisional?: boolean
}
export interface AuditConfig {
  classification: ClassificationConfig
  requiredFields: RequiredFieldConfig[]
  optionalFieldNames: string[]
  allowedMilestoneNames: string[]
  startDate: StartDateConfig
  taskPrefixes: string[]
  subtaskKeys: string[]
  completedBy: 'closed' | 'projectStatus'
  completedStatuses: string[]
  rules: RuleConfig[]
}
export interface Filters {
  query: string
  assignee: string
  category: 'all' | Category
  severity: 'all' | Severity
  view: 'all' | 'findings' | 'insufficient'
  dateField: 'updatedAt' | 'createdAt' | 'closedAt' | 'start' | 'collectedAt'
  from: string
  to: string
}
export interface ContactChannel {
  name: string
  url: string
  display?: string
}
export interface DeveloperInfo {
  name: string
  contact?: ContactChannel
}
