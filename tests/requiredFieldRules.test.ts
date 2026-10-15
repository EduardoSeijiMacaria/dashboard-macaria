import { describe, expect, it } from 'vitest'
import { evaluate } from '../src/rules/engine'
import { defaultConfig } from '../src/services/config'
import type { AuditConfig, AuditIssue, FieldState, ProjectValue } from '../src/types/domain'

const requiredFieldNames = defaultConfig.requiredFields.map((field) => field.name)

function createValue(value: string): ProjectValue {
  return { state: value.trim() === '' ? 'empty' : 'value', value }
}

function createCompleteFields(): Record<string, ProjectValue> {
  const fields: Record<string, ProjectValue> = {}
  for (const fieldName of requiredFieldNames) fields[fieldName] = createValue('sim')
  fields.Status = createValue('Done')
  fields['FF Status'] = createValue('On FF')
  fields['Bugs Sbx'] = createValue('0')
  fields['Bugs Stg'] = createValue('0')
  fields['Bugs Prod'] = createValue('0')
  fields.Tag = createValue('N/A')
  fields.Start = createValue('2026-10-05')
  return fields
}

function createIssue(fields: Record<string, ProjectValue>): AuditIssue {
  return {
    id: 'I1',
    number: 1,
    url: 'https://example.test/issues/1',
    title: 'Issue',
    state: 'open',
    assignees: [],
    labels: [],
    milestone: 'Quality Assistance 2026',
    category: 'other',
    categoryOrigin: 'unclassified',
    createdAt: '2026-10-01T12:00:00Z',
    updatedAt: '2026-10-13T12:00:00Z',
    childIds: [],
    fields
  }
}

function summarize(issue: AuditIssue, config: AuditConfig = defaultConfig) {
  const result = evaluate([issue], config)
  return {
    findings: result.findings.map((finding) => `${finding.ruleId}:${finding.field}`),
    nonEvaluated: result.nonEvaluated.map((check) => check.ruleId)
  }
}

describe('required Project fields', () => {
  it('uses the real field names of the Project', () => {
    expect(requiredFieldNames).toEqual([
      'Status',
      'Tag',
      'QA Apply',
      'QA Early',
      'Test Mode',
      'Dev Docs',
      'Initiative',
      'Team',
      'FF Name',
      'FF Status',
      'Bugs Sbx',
      'Bugs Stg',
      'Bugs Prod'
    ])
  })

  it('reports nothing when every required field is filled, with 0 and N/A as valid values', () => {
    expect(summarize(createIssue(createCompleteFields()))).toEqual({
      findings: [],
      nonEvaluated: []
    })
  })

  it.each(requiredFieldNames)('reports an empty %s with its real name', (fieldName) => {
    const fields = createCompleteFields()
    fields[fieldName] = { state: 'empty' }
    const result = evaluate([createIssue(fields)], defaultConfig)
    const requiredFinding = result.findings.find((finding) => finding.field === fieldName)
    expect(requiredFinding?.ruleId).toBe('FIELD-001')
    expect(requiredFinding?.severity).toBe('error')
  })

  it('reports each empty required field in its own finding', () => {
    const fields = createCompleteFields()
    fields.Team = { state: 'empty' }
    fields['Dev Docs'] = createValue('   ')
    const result = evaluate([createIssue(fields)], defaultConfig)
    expect(result.findings.map((finding) => finding.field)).toEqual(['Dev Docs', 'Team'])
    expect(new Set(result.findings.map((finding) => finding.id)).size).toBe(2)
  })

  it.each([
    ['Initiative', 'rules.requiredField'],
    ['Tag', 'rules.tag'],
    ['Bugs Sbx', 'rules.bugs'],
    ['Bugs Stg', 'rules.bugs'],
    ['Bugs Prod', 'rules.bugs']
  ])('explains an empty %s with the message key %s', (fieldName, expectedKey) => {
    const fields = createCompleteFields()
    fields[fieldName] = { state: 'empty' }
    const result = evaluate([createIssue(fields)], defaultConfig)
    expect(result.findings[0].explanation).toEqual({ key: expectedKey })
  })

  it.each([
    ['Test Mode', 'Yes'],
    ['Test Mode', 'No'],
    ['Dev Docs', 'Yes'],
    ['Dev Docs', 'No'],
    ['Tag', 'N/A'],
    ['Bugs Sbx', '0'],
    ['Bugs Stg', '0'],
    ['Bugs Prod', '0']
  ])('accepts %s with the value %s as filled', (fieldName, value) => {
    const fields = createCompleteFields()
    fields[fieldName] = createValue(value)
    expect(summarize(createIssue(fields)).findings).toEqual([])
  })

  it.each(['Execution Time', 'End', 'Release date'])('does not require %s', (fieldName) => {
    const fields = createCompleteFields()
    fields[fieldName] = { state: 'empty' }
    expect(summarize(createIssue(fields)).findings).toEqual([])
  })

  it('does not validate fields that are not listed, such as the separator fields', () => {
    const fields = createCompleteFields()
    fields['Task --------------------------------------'] = { state: 'empty' }
    fields['SubTask  -------------------------------'] = { state: 'empty' }
    expect(summarize(createIssue(fields))).toEqual({ findings: [], nonEvaluated: [] })
  })

  it.each<[string, FieldState | 'missing', string]>([
    ['not queried', 'missing', 'availability.not-queried'],
    ['no access', 'unavailable', 'availability.no-access'],
    ['not found in the Project', 'unconfigured', 'availability.not-found'],
    ['query failure', 'error', 'availability.query-failed']
  ])('marks a field with %s as not evaluated, never as empty', (_caseName, state, stateKey) => {
    const fields = createCompleteFields()
    if (state === 'missing') delete fields.Team
    else fields.Team = { state }
    const result = evaluate([createIssue(fields)], defaultConfig)
    expect(result.findings).toEqual([])
    expect(result.nonEvaluated).toHaveLength(1)
    expect(result.nonEvaluated[0].reason).toEqual({
      key: 'notEvaluated.cannotRead',
      params: {
        fields: {
          list: [
            {
              key: 'notEvaluated.fieldWithState',
              params: { name: 'Team', state: { key: stateKey } }
            }
          ],
          kind: 'comma'
        }
      }
    })
  })

  it('marks an issue with no Project fields as not evaluated for both rules and reports no error', () => {
    expect(summarize(createIssue({}))).toEqual({
      findings: [],
      nonEvaluated: ['FIELD-001', 'FIELD-002']
    })
  })

  it('reads the required fields from the config', () => {
    const fields = createCompleteFields()
    fields.Team = { state: 'empty' }
    const configWithoutTeam: AuditConfig = {
      ...defaultConfig,
      requiredFields: defaultConfig.requiredFields.filter((field) => field.name !== 'Team')
    }
    expect(summarize(createIssue(fields), configWithoutTeam).findings).toEqual([])
  })
})

describe('Start when the Status is not Todo', () => {
  it('reports an empty Start with Status Done', () => {
    const fields = createCompleteFields()
    fields.Start = { state: 'empty' }
    const result = evaluate([createIssue(fields)], defaultConfig)
    expect(result.findings).toHaveLength(1)
    expect(result.findings[0].field).toBe('Start')
    expect(result.findings[0].explanation).toEqual({
      key: 'rules.startRequired',
      params: { statusField: 'Status', optionalStatus: 'Todo' }
    })
  })

  it('accepts an empty Start with Status Todo, ignoring case and spaces', () => {
    const fields = createCompleteFields()
    fields.Start = { state: 'empty' }
    fields.Status = createValue(' todo ')
    expect(summarize(createIssue(fields))).toEqual({ findings: [], nonEvaluated: [] })
  })

  it('creates no finding for a filled Start with Status Todo', () => {
    const fields = createCompleteFields()
    fields.Status = createValue('Todo')
    expect(summarize(createIssue(fields))).toEqual({ findings: [], nonEvaluated: [] })
  })

  it('marks the check not evaluated when the Status is unavailable, and does not assume it differs from Todo', () => {
    const fields = createCompleteFields()
    fields.Start = { state: 'empty' }
    fields.Status = { state: 'unavailable' }
    const result = evaluate([createIssue(fields)], defaultConfig)
    expect(result.findings).toEqual([])
    const startCheck = result.nonEvaluated.find((check) => check.ruleId === 'FIELD-002')
    expect(startCheck?.field).toBe('Start')
    expect(startCheck?.reason).toEqual({
      key: 'notEvaluated.statusUnknown',
      params: {
        statusField: 'Status',
        state: { key: 'availability.no-access' },
        optionalStatus: 'Todo'
      }
    })
  })

  it('marks the check not evaluated when the Status is empty', () => {
    const fields = createCompleteFields()
    fields.Start = { state: 'empty' }
    fields.Status = { state: 'empty' }
    const result = evaluate([createIssue(fields)], defaultConfig)
    expect(result.findings.map((finding) => finding.field)).toEqual(['Status'])
    expect(result.nonEvaluated[0].reason).toEqual({
      key: 'notEvaluated.statusEmpty',
      params: { statusField: 'Status', optionalStatus: 'Todo' }
    })
  })

  it('marks the check not evaluated when the Start was not collected and the Status is not Todo', () => {
    const fields = createCompleteFields()
    fields.Start = { state: 'unconfigured' }
    const result = evaluate([createIssue(fields)], defaultConfig)
    expect(result.findings).toEqual([])
    expect(result.nonEvaluated[0].reason).toEqual({
      key: 'notEvaluated.startUnavailable',
      params: { field: 'Start', state: { key: 'availability.not-found' } }
    })
  })

  it('does not need the Start when the Status is Todo', () => {
    const fields = createCompleteFields()
    fields.Start = { state: 'unavailable' }
    fields.Status = createValue('Todo')
    expect(summarize(createIssue(fields))).toEqual({ findings: [], nonEvaluated: [] })
  })

  it('is silent when the rule is disabled', () => {
    const fields = createCompleteFields()
    fields.Start = { state: 'empty' }
    const disabledRules = defaultConfig.rules.map((rule) =>
      rule.id === 'FIELD-002' ? { ...rule, enabled: false } : rule
    )
    expect(
      summarize(createIssue(fields), { ...defaultConfig, rules: disabledRules }).findings
    ).toEqual([])
  })
})
