import { afterEach, describe, expect, it, vi } from 'vitest'
import { GitHubClient } from '../src/services/github'
import { readMessageKey, readMessageParams } from './support/messageKey'

const sampleToken = 'sample-token-for-tests'

function stubFetchStatus(status: number): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('{}', { status }))
  )
}

function createIssueResponse(number: number, overrides: Record<string, unknown> = {}) {
  return {
    id: number,
    number,
    html_url: `https://example.test/issues/${number}`,
    title: `Issue ${number}`,
    body: null,
    state: 'open',
    assignees: [],
    labels: [],
    milestone: null,
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-02T12:00:00Z',
    closed_at: null,
    ...overrides
  }
}

describe('GitHubClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    [401, 'errors.github401'],
    [403, 'errors.github403'],
    [404, 'errors.github404']
  ])(
    'explains status %i with its own message key, without the token',
    async (status, expectedKey) => {
      stubFetchStatus(status)
      const failure = await new GitHubClient(sampleToken)
        .listIssues('acme', 'qa-board')
        .catch((error: Error) => error)
      expect(failure).toBeInstanceOf(Error)
      expect(readMessageKey(failure)).toBe(expectedKey)
      expect(
        JSON.stringify((failure as unknown as { messageRef: unknown }).messageRef)
      ).not.toContain(sampleToken)
    }
  )

  it('gives each status its own message', async () => {
    const keys: Array<string | undefined> = []
    for (const status of [401, 403, 404]) {
      stubFetchStatus(status)
      const failure = await new GitHubClient(sampleToken)
        .listIssues('acme', 'qa-board')
        .catch((error: Error) => error)
      keys.push(readMessageKey(failure))
    }
    expect(new Set(keys).size).toBe(3)
  })

  it('keeps the status code and text for other statuses', async () => {
    stubFetchStatus(400)
    const failure = await new GitHubClient(sampleToken)
      .listIssues('acme', 'qa-board')
      .catch((error: Error) => error)

    expect(readMessageKey(failure)).toBe('errors.githubOther')
    expect(readMessageParams(failure)?.status).toBe(400)
  })

  it('returns an empty list for a repository with no issues', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('[]', { status: 200 }))
    )
    expect(await new GitHubClient(sampleToken).listIssues('acme', 'qa-board')).toEqual([])
  })

  it('drops pull requests from the list', async () => {
    const body = JSON.stringify([
      createIssueResponse(1),
      createIssueResponse(2, { pull_request: {} })
    ])
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(body, { status: 200 }))
    )
    const issues = await new GitHubClient(sampleToken).listIssues('acme', 'qa-board')
    expect(issues.map((issue) => issue.number)).toEqual([1])
  })

  describe('classification of listed issues', () => {
    async function listClassifiedIssues(issueOverrides: Record<string, unknown>) {
      const body = JSON.stringify([createIssueResponse(1, issueOverrides)])
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(body, { status: 200 }))
      )
      const [issue] = await new GitHubClient(sampleToken).listIssues('acme', 'qa-board')
      return issue
    }

    it('classifies by the native type', async () => {
      const issue = await listClassifiedIssues({ type: { name: 'Task' } })
      expect([issue.category, issue.categoryOrigin]).toEqual(['task', 'type'])
    })

    it('classifies a subtask type with extra spaces and other case', async () => {
      const issue = await listClassifiedIssues({ type: { name: ' SUBTASK ' } })
      expect([issue.category, issue.categoryOrigin]).toEqual(['subtask', 'type'])
    })

    it('marks an unknown type as other with origin type', async () => {
      const issue = await listClassifiedIssues({
        type: { name: 'Bug' },
        labels: [{ name: 'task' }]
      })
      expect([issue.category, issue.categoryOrigin]).toEqual(['other', 'type'])
    })

    it('lets the type win over a conflicting label', async () => {
      const issue = await listClassifiedIssues({
        type: { name: 'Task' },
        labels: [{ name: 'subtask' }]
      })
      expect([issue.category, issue.categoryOrigin]).toEqual(['task', 'type'])
    })

    it('falls back to one label when the type is null', async () => {
      const issue = await listClassifiedIssues({ type: null, labels: [{ name: 'Subtask' }] })
      expect([issue.category, issue.categoryOrigin]).toEqual(['subtask', 'label'])
    })

    it('falls back to a label when the type field is missing', async () => {
      const issue = await listClassifiedIssues({ labels: ['task'] })
      expect([issue.category, issue.categoryOrigin]).toEqual(['task', 'label'])
    })

    it('does not guess when both labels match', async () => {
      const issue = await listClassifiedIssues({
        type: null,
        labels: [{ name: 'task' }, { name: 'subtask' }]
      })
      expect([issue.category, issue.categoryOrigin]).toEqual(['other', 'unclassified'])
    })

    it('leaves an issue with no type and no labels unclassified', async () => {
      const issue = await listClassifiedIssues({})
      expect([issue.category, issue.categoryOrigin]).toEqual(['other', 'unclassified'])
    })

    it('treats a malformed type as no type without failing the sync', async () => {
      const issue = await listClassifiedIssues({ type: 'Task', labels: ['task'] })
      expect([issue.category, issue.categoryOrigin]).toEqual(['task', 'label'])
    })
  })

  describe('getIssue', () => {
    it('requests one issue by number and classifies it', async () => {
      const fetchSpy = vi.fn(
        async () =>
          new Response(JSON.stringify(createIssueResponse(7, { type: { name: 'Task' } })), {
            status: 200
          })
      )
      vi.stubGlobal('fetch', fetchSpy)
      const issue = await new GitHubClient(sampleToken).getIssue('acme', 'qa-board', 7)
      expect((fetchSpy.mock.calls[0] as unknown as [string])[0]).toBe(
        'https://api.github.com/repos/acme/qa-board/issues/7'
      )
      expect([issue.number, issue.category, issue.categoryOrigin]).toEqual([7, 'task', 'type'])
    })

    it.each([404, 410])('says the issue was not found or removed on status %i', async (status) => {
      stubFetchStatus(status)
      const failure = await new GitHubClient(sampleToken)
        .getIssue('acme', 'qa-board', 7)
        .catch((error: Error) => error)
      expect(readMessageKey(failure)).toBe('errors.issueMissing')
      expect(readMessageParams(failure)).toEqual({ number: 7 })
    })

    it('keeps the repository message for a 404 on the list', async () => {
      stubFetchStatus(404)
      const failure = await new GitHubClient(sampleToken)
        .listIssues('acme', 'qa-board')
        .catch((error: Error) => error)
      expect(readMessageKey(failure)).toBe('errors.github404')
    })

    it('does not print the response to the console', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(JSON.stringify(createIssueResponse(7)), { status: 200 }))
      )
      await new GitHubClient(sampleToken).getIssue('acme', 'qa-board', 7)
      expect(logSpy).not.toHaveBeenCalled()
      logSpy.mockRestore()
    })

    it('rejects a pull request', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response(JSON.stringify(createIssueResponse(7, { pull_request: {} })), {
              status: 200
            })
        )
      )
      const failure = await new GitHubClient(sampleToken)
        .getIssue('acme', 'qa-board', 7)
        .catch((error: Error) => error)
      expect(readMessageKey(failure)).toBe('errors.pullRequest')
      expect(readMessageParams(failure)).toEqual({ number: 7 })
    })

    it('rejects an invalid response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response('{"id":"x"}', { status: 200 }))
      )
      const failure = await new GitHubClient(sampleToken)
        .getIssue('acme', 'qa-board', 7)
        .catch((error: Error) => error)
      expect(readMessageKey(failure)).toBe('errors.invalidIssue')
    })
  })

  it('bypasses the browser cache on list and single-issue requests', async () => {
    const fetchSpy = vi.fn(
      async (_url: string, _init: RequestInit) =>
        new Response(JSON.stringify(createIssueResponse(1)), { status: 200 })
    )
    vi.stubGlobal('fetch', fetchSpy)
    const client = new GitHubClient(sampleToken)
    await client.getIssue('acme', 'qa-board', 1)
    fetchSpy.mockImplementation(async () => new Response('[]', { status: 200 }))
    await client.listIssues('acme', 'qa-board')
    const cacheModes = fetchSpy.mock.calls.map(([, requestInit]) => requestInit.cache)
    expect(cacheModes).toEqual(['no-store', 'no-store'])
  })

  it('sends the token only in the authorization header', async () => {
    const fetchSpy = vi.fn(async () => new Response('[]', { status: 200 }))
    vi.stubGlobal('fetch', fetchSpy)
    await new GitHubClient(sampleToken).listIssues('acme', 'qa-board')
    const [requestUrl, requestInit] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit]
    expect(requestUrl).not.toContain(sampleToken)
    expect((requestInit.headers as Record<string, string>).Authorization).toBe(
      `Bearer ${sampleToken}`
    )
  })
})
