import { afterEach, describe, expect, it, vi } from 'vitest'
import { defaultConfig } from '../src/services/config'
import { evaluate } from '../src/rules/engine'
import { GitHubClient } from '../src/services/github'
import type { AuditIssue } from '../src/types/domain'

function createField(value?: string) {
  return { state: value === undefined ? 'empty' : 'value', value } as const
}

function createIssue(overrides: Partial<AuditIssue>): AuditIssue {
  return {
    id: 'T1',
    number: 1,
    url: 'https://example.test/issues/1',
    title: 'Issue',
    state: 'open',
    assignees: [],
    labels: [],
    milestone: 'Quality Assistance 2026',
    category: 'task',
    categoryOrigin: 'type',
    createdAt: '2026-10-01T12:00:00Z',
    updatedAt: '2026-10-13T12:00:00Z',
    childIds: [],
    fields: {},
    ...overrides
  }
}

function createTaskWithSubtasks(): AuditIssue[] {
  const task = createIssue({
    id: 'T1',
    title: 'Release | fluxo de compra 2026-10-15',
    labels: ['Task'],
    childIds: ['S1', 'S2'],
    fields: {
      Status: createField('Validated'),
      Tag: createField(),
      Initiative: createField('Checkout'),
      'FF Name': createField('checkout-v2'),
      'FF Status': createField('On FF'),
      Start: createField('2026-10-05')
    }
  })
  const malformedSubtask = createIssue({
    id: 'S1',
    category: 'subtask',
    title: '[MACARIA} - Scenario generation - Checkout',
    state: 'closed',
    labels: ['Subtask'],
    parentId: 'T1',
    fields: {
      Status: createField('Done'),
      Initiative: createField('Checkout'),
      'FF Name': createField('checkout-v2'),
      'FF Status': createField('On FF'),
      Start: createField()
    }
  })
  const singularSubtask = createIssue({
    id: 'S2',
    category: 'subtask',
    title: '[MACARIA] - EXPANSAO-12',
    state: 'closed',
    labels: ['Subtask'],
    parentId: 'T1',
    fields: {
      Status: createField('Done'),
      Initiative: createField('Checkout'),
      'FF Name': createField(''),
      'FF Status': createField('No FF'),
      Start: createField()
    }
  })
  return [task, malformedSubtask, singularSubtask]
}

function createRegressionSubtask(): AuditIssue {
  return createIssue({
    id: 'S3',
    category: 'subtask',
    title: '[MACARIA] - Scenarios regression - Pagamentos',
    labels: ['Subtask'],
    fields: {
      Status: createField('Todo'),
      Initiative: createField(),
      'FF Name': createField(),
      'FF Status': createField(),
      Start: createField()
    }
  })
}

function createChildlessTask(): AuditIssue {
  return createIssue({
    id: 'T2',
    title: 'Release sem data',
    labels: ['Task'],
    fields: {
      Status: createField('Todo'),
      Tag: createField(),
      Initiative: createField(),
      'FF Name': createField(),
      'FF Status': createField(),
      Start: createField('2026-10-10')
    }
  })
}

async function listSyncedIssues(issueResponses: Record<string, unknown>[]): Promise<AuditIssue[]> {
  const syncedBody = JSON.stringify(
    issueResponses.map((overrides, index) => ({
      id: index + 1,
      number: index + 1,
      html_url: `https://example.test/issues/${index + 1}`,
      title: 'Issue',
      body: null,
      state: 'open',
      assignees: [],
      labels: [],
      milestone: { title: 'Quality Engineering 2026' },
      created_at: '2026-10-01T12:00:00Z',
      updated_at: '2026-10-02T12:00:00Z',
      closed_at: null,
      ...overrides
    }))
  )
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(syncedBody, { status: 200 }))
  )
  return new GitHubClient('sample-token-for-tests').listIssues('acme', 'qa-board')
}

describe('audit engine on synced issues', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('checks a valid classified task and subtask without false errors when Project fields are missing', async () => {
    const issues = await listSyncedIssues([
      { title: 'Release | fluxo de compra 2026-10-15', type: { name: 'Task' } },
      { title: '[MACARIA] - Scenarios regression - Pagamentos', type: { name: 'Subtask' } }
    ])
    const result = evaluate(issues, defaultConfig)
    expect(result.findings).toEqual([])
    expect(result.nonEvaluated.map((check) => `${check.issueId}:${check.ruleId}`)).toEqual([
      '1:FIELD-001',
      '1:FIELD-002',
      '2:FIELD-001',
      '2:FIELD-002'
    ])
  })

  it('runs the task title rule for a task found by the label fallback', async () => {
    const issues = await listSyncedIssues([{ title: 'Sem formato', labels: ['task'] }])
    const result = evaluate(issues, defaultConfig)
    expect(result.findings.map((finding) => finding.ruleId)).toEqual(['TASK-001', 'TASK-002'])
  })

  it('runs no task or subtask rule for an unclassified issue', async () => {
    const issues = await listSyncedIssues([{ title: 'Sem formato' }])
    const result = evaluate(issues, defaultConfig)
    expect(result.findings).toEqual([])
    expect(result.nonEvaluated.map((check) => check.ruleId)).toEqual(['FIELD-001', 'FIELD-002'])
  })
})

describe('audit engine', () => {
  it('detects malformed title, singular title, missing tag and relational divergence', () => {
    const { findings } = evaluate(
      [...createTaskWithSubtasks(), createChildlessTask()],
      defaultConfig
    )
    expect(findings.map((finding) => finding.ruleId)).toEqual(
      expect.arrayContaining(['FIELD-001', 'SUB-001', 'SUB-003', 'FF-003'])
    )
  })

  it('creates no finding for a filled Start with Status Todo', () => {
    const { findings } = evaluate([createChildlessTask()], defaultConfig)
    expect(findings.some((finding) => finding.field === 'Start')).toBe(false)
  })

  it('does not flag an accepted regression convention', () => {
    const { findings } = evaluate([createRegressionSubtask()], defaultConfig)
    expect(
      findings.some((finding) => finding.issueId === 'S3' && finding.ruleId === 'SUB-004')
    ).toBe(false)
  })

  it('marks missing project fields as not evaluated instead of empty', () => {
    const [task] = createTaskWithSubtasks()
    task.fields.Tag = { state: 'unavailable' }
    const result = evaluate([task], defaultConfig)
    expect(result.findings.some((finding) => finding.field === 'Tag')).toBe(false)
    expect(JSON.stringify(result.nonEvaluated)).toContain('"name":"Tag"')
    expect(JSON.stringify(result.nonEvaluated)).toContain('availability.no-access')
  })

  it('does not treat zero children as all complete', () => {
    const task = createChildlessTask()
    task.title = 'Release | válido 2026-10-20'
    const result = evaluate([task], defaultConfig)
    expect(result.findings.some((finding) => finding.ruleId === 'TASK-005')).toBe(false)
  })
})
