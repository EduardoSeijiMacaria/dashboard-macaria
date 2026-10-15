import { describe, expect, it } from 'vitest'
import { defaultConfig } from '../src/services/config'
import { GitHubApiError } from '../src/services/github'
import type { ProjectFieldDefinition, ProjectItem } from '../src/services/githubProject'
import {
  getFieldStateAfterFailure,
  listCollectedFieldNames,
  markProjectFields,
  mergeProjectFields
} from '../src/services/projectFields'
import type { AuditIssue } from '../src/types/domain'

const fieldNames = ['Status', 'Tag', 'Bugs Sbx']

const fieldDefinitions: ProjectFieldDefinition[] = [
  { id: 1, name: 'Status', dataType: 'single_select' },
  { id: 2, name: 'Tag', dataType: 'text' },
  { id: 3, name: 'Task --------------------------------------', dataType: 'text' }
]

function createIssue(id: string): AuditIssue {
  return {
    id,
    number: Number(id.slice(-1)),
    url: `https://example.test/issues/${id}`,
    title: `Issue ${id}`,
    state: 'open',
    assignees: [],
    labels: [],
    category: 'task',
    categoryOrigin: 'type',
    createdAt: '2026-10-01T12:00:00Z',
    updatedAt: '2026-10-02T12:00:00Z',
    childIds: [],
    fields: {}
  }
}

function createItem(
  itemId: number,
  issueId: string,
  values: Array<[number, unknown]>
): ProjectItem {
  return { itemId, issueId, valuesByFieldId: new Map(values) }
}

describe('listCollectedFieldNames', () => {
  it('lists the required, Start, and optional fields once, and no separator', () => {
    const names = listCollectedFieldNames(defaultConfig)

    expect(names).toContain('Status')
    expect(names).toContain('Start')
    expect(names).toContain('Execution Time')
    expect(names).toContain('Release date')
    expect(new Set(names).size).toBe(names.length)
    expect(names.some((name) => name.includes('-----'))).toBe(false)
  })
})

describe('mergeProjectFields', () => {
  const statusValue = { id: 'f75ad846', name: { raw: 'Todo', html: 'Todo' } }

  it('gives each issue the values of its own item, matched by content.id', () => {
    const issues = [createIssue('1001'), createIssue('1002')]
    const items = [
      createItem(1002, '1001', [
        [1, statusValue],
        [2, { raw: 'v1', html: 'v1' }],
        [4, 0]
      ]),
      createItem(1001, '1002', [
        [1, null],
        [2, null],
        [4, null]
      ])
    ]
    const definitions = [...fieldDefinitions, { id: 4, name: 'Bugs Sbx', dataType: 'number' }]

    const [firstIssue, secondIssue] = mergeProjectFields(
      issues,
      { fieldDefinitions: definitions, items },
      fieldNames
    )

    expect(firstIssue.fields.Status.value).toBe('Todo')
    expect(firstIssue.fields['Bugs Sbx'].value).toBe('0')
    expect(firstIssue.projectItemId).toBe('1002')
    expect(secondIssue.fields.Status.state).toBe('empty')
    expect(secondIssue.projectItemId).toBe('1001')
  })

  it('marks every field of an issue with no item as outside the Project', () => {
    const [issue] = mergeProjectFields(
      [createIssue('1001')],
      { fieldDefinitions, items: [] },
      fieldNames
    )

    expect(Object.values(issue.fields).map((field) => field.state)).toEqual([
      'outside-project',
      'outside-project',
      'outside-project'
    ])
    expect(issue.projectItemId).toBeUndefined()
  })

  it('marks a configured field that the Project does not have as not found', () => {
    const items = [
      createItem(1, '1001', [
        [1, null],
        [2, null]
      ])
    ]

    const [issue] = mergeProjectFields(
      [createIssue('1001')],
      { fieldDefinitions, items },
      fieldNames
    )

    expect(issue.fields['Bugs Sbx'].state).toBe('unconfigured')
  })

  it('marks a field with no value in the item as a query error, never as empty', () => {
    const items = [createItem(1, '1001', [[1, null]])]

    const [issue] = mergeProjectFields(
      [createIssue('1001')],
      { fieldDefinitions, items },
      fieldNames
    )

    expect(issue.fields.Tag.state).toBe('error')
  })

  it('does not collect the separator fields', () => {
    const items = [
      createItem(1, '1001', [
        [1, null],
        [2, null],
        [3, null]
      ])
    ]

    const [issue] = mergeProjectFields(
      [createIssue('1001')],
      { fieldDefinitions, items },
      fieldNames
    )

    expect(Object.keys(issue.fields)).toEqual(fieldNames)
  })

  it('does not change the issues it receives', () => {
    const issue = createIssue('1001')

    mergeProjectFields([issue], { fieldDefinitions, items: [] }, fieldNames)

    expect(issue.fields).toEqual({})
  })
})

describe('markProjectFields', () => {
  it('gives every field the same state', () => {
    const [issue] = markProjectFields([createIssue('1001')], fieldNames, 'unavailable')

    expect(Object.values(issue.fields).every((field) => field.state === 'unavailable')).toBe(true)
  })
})

describe('getFieldStateAfterFailure', () => {
  it.each([
    ['a 401', new GitHubApiError({ key: 'errors.github401' }, 401), 'unavailable'],
    ['a 403', new GitHubApiError({ key: 'errors.github401' }, 403), 'unavailable'],
    ['a 404', new GitHubApiError({ key: 'errors.github401' }, 404), 'unavailable'],
    ['a 500', new GitHubApiError({ key: 'errors.github401' }, 500), 'error'],
    ['a network failure', new TypeError('Failed to fetch'), 'error']
  ])('maps %s to %s', (_caseName, failure, expectedState) => {
    expect(getFieldStateAfterFailure(failure)).toBe(expectedState)
  })
})
