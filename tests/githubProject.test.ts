import { describe, expect, it } from 'vitest'
import {
  toProjectFieldDefinitions,
  toProjectItem,
  toProjectValue
} from '../src/services/githubProject'
import { captureError, readMessageKey } from './support/messageKey'

function createItemResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 271850202,
    content_type: 'Issue',
    content: { id: 5855462797, number: 1 },
    fields: [{ id: 426488558, name: 'Tag', data_type: 'text', value: null }],
    ...overrides
  }
}

describe('toProjectValue', () => {
  it.each([
    ['an empty field', null, 'empty', undefined],
    ['a text', { raw: 'N/A', html: 'N/A' }, 'value', 'N/A'],
    [
      'a selected option',
      { id: 'cdd29be9', name: { raw: 'Yes', html: 'Yes' }, color: 'GRAY' },
      'value',
      'Yes'
    ],
    ['the number zero', 0, 'value', '0'],
    ['a number', 12.5, 'value', '12.5'],
    ['a date as text', '2026-10-05', 'value', '2026-10-05'],
    ['a shape nobody knows', { unexpected: true }, 'error', undefined]
  ])('reads %s', (_caseName, rawValue, expectedState, expectedValue) => {
    const projectValue = toProjectValue(rawValue)

    expect(projectValue.state).toBe(expectedState)
    expect(projectValue.value).toBe(expectedValue)
    expect(projectValue.raw).toEqual(rawValue)
  })
})

describe('toProjectItem', () => {
  it('relates the item to the issue by content.id, never by the item id', () => {
    const item = toProjectItem(createItemResponse())

    expect(item?.itemId).toBe(271850202)
    expect(item?.issueId).toBe('5855462797')
  })

  it('keeps the value of each field by field id', () => {
    const item = toProjectItem(createItemResponse())

    expect(item?.valuesByFieldId.has(426488558)).toBe(true)
    expect(item?.valuesByFieldId.get(426488558)).toBeNull()
  })

  it.each(['PullRequest', 'DraftIssue'])('ignores an item of type %s', (contentType) => {
    expect(toProjectItem(createItemResponse({ content_type: contentType }))).toBeUndefined()
  })

  it.each([
    ['a text', 'texto'],
    ['an item without fields', { id: 1, content_type: 'Issue', content: { id: 2 } }],
    ['a field without id', createItemResponse({ fields: [{ name: 'Tag' }] })]
  ])('rejects %s with the invalid-items message key', (_caseName, response) => {
    expect(readMessageKey(captureError(() => toProjectItem(response)))).toBe(
      'errors.invalidProjectItems'
    )
  })
})

describe('toProjectFieldDefinitions', () => {
  it('reads the id, name, and type of each field', () => {
    const definitions = toProjectFieldDefinitions([
      { id: 426488555, name: 'Start', data_type: 'date' }
    ])

    expect(definitions).toEqual([{ id: 426488555, name: 'Start', dataType: 'date' }])
  })

  it('rejects a field without a name', () => {
    expect(readMessageKey(captureError(() => toProjectFieldDefinitions([{ id: 1 }])))).toBe(
      'errors.invalidProjectFields'
    )
  })
})
