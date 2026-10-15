import { describe, expect, it } from 'vitest'
import {
  parseProjectNumber,
  parseRepositoryUrl,
  requireGithubToken
} from '../src/services/syncSettings'
import { captureError, readMessageKey } from './support/messageKey'

describe('parseRepositoryUrl', () => {
  const acceptedInputs: Array<[string, string]> = [
    ['https://github.com/acme/qa-board', 'full URL'],
    ['https://github.com/acme/qa-board.git', 'URL with .git'],
    ['https://github.com/acme/qa-board/', 'URL with trailing slash'],
    ['https://github.com/acme/qa-board.git/', 'URL with .git and slash'],
    ['acme/qa-board', 'short form'],
    ['  acme/qa-board  ', 'short form with spaces around']
  ]

  it.each(acceptedInputs)('reads owner and repository from %s (%s)', (rawValue) => {
    expect(parseRepositoryUrl(rawValue)).toEqual({ owner: 'acme', repository: 'qa-board' })
  })

  it('keeps dots inside the repository name', () => {
    expect(parseRepositoryUrl('acme/site.v2')).toEqual({ owner: 'acme', repository: 'site.v2' })
  })

  const rejectedInputs: Array<[string, string]> = [
    ['', 'empty value'],
    ['   ', 'blank value'],
    ['acme', 'owner only'],
    ['https://github.com/acme', 'URL without repository'],
    ['https://github.com/acme/qa-board/issues', 'URL with extra path'],
    ['http://github.com/acme/qa-board', 'insecure scheme'],
    ['https://gitlab.com/acme/qa-board', 'other host'],
    ['acme/qa board', 'space inside name'],
    ['acme/..', 'dots-only repository'],
    ['acme//qa-board', 'empty segment'],
    ['https://github.com/acme/qa-board?tab=issues', 'query string']
  ]

  it.each(rejectedInputs)('rejects %s (%s) with a repository message key', (rawValue) => {
    const error = captureError(() => parseRepositoryUrl(rawValue))

    expect(readMessageKey(error)).toMatch(/^errors\.repository(Missing|Invalid)$/)
  })

  it('reports a missing value differently from an invalid one', () => {
    expect(readMessageKey(captureError(() => parseRepositoryUrl('')))).toBe(
      'errors.repositoryMissing'
    )
    expect(readMessageKey(captureError(() => parseRepositoryUrl('acme')))).toBe(
      'errors.repositoryInvalid'
    )
  })

  it('does not repeat the rejected value in the message', () => {
    const error = captureError(() => parseRepositoryUrl('ghp_notARealSecret'))

    expect(JSON.stringify((error as { messageRef: unknown }).messageRef)).not.toContain(
      'ghp_notARealSecret'
    )
  })
})

describe('requireGithubToken', () => {
  it('returns the token without surrounding spaces', () => {
    expect(requireGithubToken('  sample-token  ')).toBe('sample-token')
  })

  it.each([
    ['empty', ''],
    ['blank', '   ']
  ])('rejects an %s token with the missing-token message key', (_label, rawToken) => {
    expect(readMessageKey(captureError(() => requireGithubToken(rawToken)))).toBe(
      'errors.tokenMissing'
    )
  })
})

describe('parseProjectNumber', () => {
  it.each([
    ['3', 3],
    ['  12  ', 12]
  ])('reads %j as the number %i', (rawValue, expectedNumber) => {
    expect(parseProjectNumber(rawValue)).toBe(expectedNumber)
  })

  it.each([[''], ['   ']])('treats %j as not configured', (rawValue) => {
    expect(parseProjectNumber(rawValue)).toBeUndefined()
  })

  it.each([['abc'], ['0'], ['-2'], ['1.5']])(
    'rejects %j with the invalid-number key',
    (rawValue) => {
      expect(readMessageKey(captureError(() => parseProjectNumber(rawValue)))).toBe(
        'errors.projectNumberInvalid'
      )
    }
  )
})
