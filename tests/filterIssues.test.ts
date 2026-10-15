import { describe, expect, it } from 'vitest'
import { matchesFilters } from '../src/services/filterIssues'
import { defaultFilters } from '../src/services/config'
import type { AuditIssue, Filters, Finding, NonEvaluated } from '../src/types/domain'

function createIssue(overrides: Partial<AuditIssue> = {}): AuditIssue {
  return {
    id: 'issue-1',
    number: 12,
    url: 'https://example.test/issues/12',
    title: 'Release | Checkout 2026-10-20',
    state: 'open',
    assignees: ['ana'],
    labels: [],
    category: 'task',
    categoryOrigin: 'type',
    createdAt: '2026-10-01T12:00:00Z',
    updatedAt: '2026-10-05T12:00:00Z',
    childIds: [],
    fields: {},
    ...overrides
  }
}

function createFinding(severity: Finding['severity']): Finding {
  return {
    id: `issue-1:${severity}`,
    ruleId: 'TASK-001',
    ruleVersion: '1.0.0',
    severity,
    issueId: 'issue-1',
    explanation: { key: 'rules.taskTitleFormat' },
    collectedAt: '2026-10-06T12:00:00Z'
  }
}

const unevaluatedCheck: NonEvaluated = {
  issueId: 'issue-1',
  ruleId: 'FIELD-001',
  reason: { key: 'notEvaluated.cannotRead' }
}

describe('matchesFilters', () => {
  it.each([
    ['no filter set', {}, createIssue(), [], [], true],
    ['search by number', { query: '12' }, createIssue(), [], [], true],
    ['search by title, ignoring case', { query: 'checkout' }, createIssue(), [], [], true],
    ['search with no match', { query: 'inexistente' }, createIssue(), [], [], false],
    ['assignee that matches', { assignee: 'ana' }, createIssue(), [], [], true],
    ['assignee that does not match', { assignee: 'bruno' }, createIssue(), [], [], false],
    ['without assignee, issue has one', { assignee: '__none__' }, createIssue(), [], [], false],
    [
      'without assignee, issue has none',
      { assignee: '__none__' },
      createIssue({ assignees: [] }),
      [],
      [],
      true
    ],
    [
      'category task on a subtask',
      { category: 'task' },
      createIssue({ category: 'subtask' }),
      [],
      [],
      false
    ],
    [
      'severity error with only a warning',
      { severity: 'error' },
      createIssue(),
      [createFinding('warning')],
      [],
      false
    ],
    [
      'severity error with an error',
      { severity: 'error' },
      createIssue(),
      [createFinding('error')],
      [],
      true
    ],
    ['view findings with no finding', { view: 'findings' }, createIssue(), [], [], false],
    [
      'view findings with a finding',
      { view: 'findings' },
      createIssue(),
      [createFinding('warning')],
      [],
      true
    ],
    [
      'view insufficient with an unchecked rule',
      { view: 'insufficient' },
      createIssue(),
      [],
      [unevaluatedCheck],
      true
    ],
    [
      'view insufficient with every rule checked',
      { view: 'insufficient' },
      createIssue(),
      [],
      [],
      false
    ],
    [
      'updated date inside the period',
      { from: '2026-10-05', to: '2026-10-05' },
      createIssue(),
      [],
      [],
      true
    ],
    ['updated date before the period', { from: '2026-10-06' }, createIssue(), [], [], false],
    [
      'collected date inside the period',
      { dateField: 'collectedAt', from: '2026-10-06', to: '2026-10-06' },
      createIssue(),
      [],
      [],
      true
    ]
  ] as Array<[string, Partial<Filters>, AuditIssue, Finding[], NonEvaluated[], boolean]>)(
    'handles %s',
    (_caseName, filterOverrides, issue, issueFindings, issueNonEvaluated, expectedMatch) => {
      const filters: Filters = { ...defaultFilters, ...filterOverrides }

      const isMatch = matchesFilters(
        issue,
        filters,
        issueFindings,
        issueNonEvaluated,
        '2026-10-06T15:00:00Z'
      )

      expect(
        isMatch,
        `filters ${JSON.stringify(filterOverrides)} should give ${expectedMatch}`
      ).toBe(expectedMatch)
    }
  )
})
