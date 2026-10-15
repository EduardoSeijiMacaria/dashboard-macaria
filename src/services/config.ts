import type { AuditConfig, Filters, RequiredFieldConfig, RuleConfig } from '../types/domain'

const ruleVersion = '1.0.0'

const rules: RuleConfig[] = [
  { id: 'TASK-001', enabled: true, severity: 'warning', version: ruleVersion },
  { id: 'TASK-002', enabled: true, severity: 'error', version: ruleVersion },
  { id: 'TASK-004', enabled: false, severity: 'error', version: ruleVersion, provisional: true },
  { id: 'TASK-005', enabled: true, severity: 'warning', version: ruleVersion },
  { id: 'SUB-001', enabled: true, severity: 'error', version: ruleVersion },
  { id: 'SUB-002', enabled: true, severity: 'error', version: ruleVersion },
  { id: 'SUB-003', enabled: true, severity: 'error', version: ruleVersion },
  { id: 'SUB-004', enabled: true, severity: 'error', version: ruleVersion },
  { id: 'FF-001', enabled: false, severity: 'error', version: ruleVersion, provisional: true },
  { id: 'FF-002', enabled: true, severity: 'warning', version: ruleVersion },
  { id: 'FF-003', enabled: true, severity: 'warning', version: ruleVersion },
  { id: 'MILESTONE-001', enabled: true, severity: 'error', version: ruleVersion },
  { id: 'FIELD-001', enabled: true, severity: 'error', version: ruleVersion },
  { id: 'FIELD-002', enabled: true, severity: 'error', version: ruleVersion }
]

const bugCountGuidance = {
  emptyMessageKey: 'rules.bugs',
  expectedKey: 'rules.bugsExpected'
} as const

const requiredFields: RequiredFieldConfig[] = [
  { name: 'Status' },
  { name: 'Tag', emptyMessageKey: 'rules.tag', expectedKey: 'rules.tagExpected' },
  { name: 'QA Apply' },
  { name: 'QA Early' },
  { name: 'Test Mode' },
  { name: 'Dev Docs' },
  { name: 'Initiative' },
  { name: 'Team' },
  { name: 'FF Name' },
  { name: 'FF Status' },
  { name: 'Bugs Sbx', ...bugCountGuidance },
  { name: 'Bugs Stg', ...bugCountGuidance },
  { name: 'Bugs Prod', ...bugCountGuidance }
]

export const defaultConfig: AuditConfig = {
  classification: {
    taskTypeName: 'Task',
    subtaskTypeName: 'Subtask',
    taskLabelName: 'task',
    subtaskLabelName: 'subtask'
  },
  requiredFields,
  optionalFieldNames: ['Execution Time', 'End', 'Release date'],
  allowedMilestoneNames: ['Quality Assistance 2026', 'Quality Engineering 2026'],
  startDate: { fieldName: 'Start', optionalWhileStatus: 'Todo' },
  taskPrefixes: ['Release', 'Hotfix', 'TestPlan', 'Support', 'Regression'],
  subtaskKeys: ['EXPANSAO', 'AQUISICAOERETENCAO'],
  completedBy: 'projectStatus',
  completedStatuses: ['Done'],
  rules
}

export const githubToken: string = __GIT_TOKEN__
export const repositoryUrl: string = __REPOSITORY_URL__
export const projectNumberSetting: string = __PROJECT_NUMBER__

export const defaultFilters: Filters = {
  query: '',
  assignee: '',
  category: 'all',
  severity: 'all',
  view: 'all',
  dateField: 'updatedAt',
  from: '',
  to: ''
}
