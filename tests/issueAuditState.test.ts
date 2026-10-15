import { describe, expect, it } from 'vitest'
import { getIssueAuditState } from '../src/services/issueAuditState'
import type { AuditIssue, Finding, NonEvaluated } from '../src/types/domain'

function createIssue(category: AuditIssue['category']): AuditIssue {
  return {
    id: 'issue-1',
    number: 1,
    url: 'https://example.test/issues/1',
    title: 'Issue 1',
    state: 'open',
    assignees: [],
    labels: [],
    category,
    categoryOrigin: 'type',
    createdAt: '2026-10-01T12:00:00Z',
    updatedAt: '2026-10-02T12:00:00Z',
    childIds: [],
    fields: {}
  }
}

function createFinding(): Finding {
  return {
    id: 'issue-1:TASK-001',
    ruleId: 'TASK-001',
    ruleVersion: '1.0.0',
    severity: 'warning',
    issueId: 'issue-1',
    explanation: { key: 'rules.taskTitleFormat' },
    collectedAt: '2026-10-02T12:00:00Z'
  }
}

function createNonEvaluated(): NonEvaluated {
  return { issueId: 'issue-1', ruleId: 'FIELD-001', reason: { key: 'notEvaluated.cannotRead' } }
}

describe('getIssueAuditState', () => {
  it.each([
    ['a finding', 'task', [createFinding()], [], 'problems'],
    [
      'a finding and an unchecked rule',
      'task',
      [createFinding()],
      [createNonEvaluated()],
      'problems'
    ],
    ['an unchecked rule', 'task', [], [createNonEvaluated()], 'not-evaluated'],
    ['no Task or Subtask category', 'other', [], [], 'not-evaluated'],
    ['every rule checked and no finding', 'subtask', [], [], 'clean']
  ] as const)(
    'gives the right state for %s',
    (_caseName, category, issueFindings, issueNonEvaluated, expectedState) => {
      const state = getIssueAuditState(
        createIssue(category),
        [...issueFindings],
        [...issueNonEvaluated]
      )

      expect(state, `category ${category} should give ${expectedState}`).toBe(expectedState)
    }
  )
})
