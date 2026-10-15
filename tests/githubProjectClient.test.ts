import { afterEach, describe, expect, it, vi } from 'vitest'
import { GitHubApiError, GitHubClient } from '../src/services/github'
import { readMessageKey } from './support/messageKey'

const sampleToken = 'sample-token-for-tests'

function createItemResponse(itemId: number, issueId: number, contentType = 'Issue') {
  return {
    id: itemId,
    content_type: contentType,
    content: { id: issueId },
    fields: [{ id: 2, name: 'Tag', data_type: 'text', value: null }]
  }
}

function stubFetchPages(pages: Array<{ body: unknown; link?: string }>) {
  const fetchSpy = vi.fn()
  for (const page of pages) {
    const headers = page.link ? { Link: page.link } : undefined
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(page.body), { status: 200, headers })
    )
  }
  vi.stubGlobal('fetch', fetchSpy)
  return fetchSpy
}

function readRequestedUrl(fetchSpy: ReturnType<typeof vi.fn>, callIndex: number): string {
  return String(fetchSpy.mock.calls[callIndex][0])
}

describe('GitHubClient Project calls', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lists the field definitions of the organization Project', async () => {
    const fetchSpy = stubFetchPages([
      { body: [{ id: 1, name: 'Status', data_type: 'single_select' }] }
    ])

    const definitions = await new GitHubClient(sampleToken).listProjectFields('acme', 3)

    expect(definitions).toEqual([{ id: 1, name: 'Status', dataType: 'single_select' }])
    expect(readRequestedUrl(fetchSpy, 0)).toBe(
      'https://api.github.com/orgs/acme/projectsV2/3/fields?per_page=100'
    )
  })

  it('asks for the values of the wanted fields, because the default response has only the title', async () => {
    const fetchSpy = stubFetchPages([{ body: [] }])

    await new GitHubClient(sampleToken).listProjectItems('acme', 3, [11, 12])

    expect(readRequestedUrl(fetchSpy, 0)).toBe(
      'https://api.github.com/orgs/acme/projectsV2/3/items?per_page=100&fields=11,12'
    )
  })

  it('follows the next-page link until there is none', async () => {
    const nextPage =
      'https://api.github.com/orgs/acme/projectsV2/3/items?per_page=100&after=abc&fields=2'
    const fetchSpy = stubFetchPages([
      { body: [createItemResponse(1, 101)], link: `<${nextPage}>; rel="next"` },
      { body: [createItemResponse(2, 102)] }
    ])

    const items = await new GitHubClient(sampleToken).listProjectItems('acme', 3, [2])

    expect(items.map((item) => item.issueId)).toEqual(['101', '102'])
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(readRequestedUrl(fetchSpy, 1)).toBe(nextPage)
  })

  it('refuses a next-page link that points outside the GitHub API, so the token never leaves', async () => {
    const fetchSpy = stubFetchPages([
      { body: [], link: '<https://evil.example/items?page=2>; rel="next"' }
    ])

    const failure = await new GitHubClient(sampleToken)
      .listProjectItems('acme', 3, [2])
      .catch((error: unknown) => error)

    expect(readMessageKey(failure)).toBe('errors.foreignLink')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('keeps only the items that are issues', async () => {
    stubFetchPages([
      {
        body: [
          createItemResponse(1, 101),
          createItemResponse(2, 102, 'PullRequest'),
          createItemResponse(3, 103, 'DraftIssue')
        ]
      }
    ])

    const items = await new GitHubClient(sampleToken).listProjectItems('acme', 3, [2])

    expect(items.map((item) => item.issueId)).toEqual(['101'])
  })

  it('reads one item by its item id', async () => {
    const fetchSpy = stubFetchPages([{ body: createItemResponse(55, 101) }])

    const item = await new GitHubClient(sampleToken).getProjectItem('acme', 3, '55', [2])

    expect(item?.issueId).toBe('101')
    expect(readRequestedUrl(fetchSpy, 0)).toBe(
      'https://api.github.com/orgs/acme/projectsV2/3/items/55?fields=2'
    )
  })

  it('sends only GET requests with the token in the header and an explicit API version', async () => {
    const fetchSpy = stubFetchPages([{ body: [] }])

    await new GitHubClient(sampleToken).listProjectFields('acme', 3)

    const requestInit = fetchSpy.mock.calls[0][1] as RequestInit
    const headers = requestInit.headers as Record<string, string>
    expect(requestInit.method).toBeUndefined()
    expect(headers.Authorization).toBe(`Bearer ${sampleToken}`)
    expect(headers['X-GitHub-Api-Version']).toBe('2022-11-28')
    expect(readRequestedUrl(fetchSpy, 0)).not.toContain(sampleToken)
  })

  it.each([
    [401, 'errors.project401'],
    [403, 'errors.project403'],
    [404, 'errors.project404']
  ])('explains a %i about the Project, without the token', async (status, expectedKey) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status }))
    )

    const failure = await new GitHubClient(sampleToken)
      .listProjectFields('acme', 3)
      .catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(GitHubApiError)
    expect((failure as GitHubApiError).status).toBe(status)
    expect(readMessageKey(failure)).toBe(expectedKey)
    expect(JSON.stringify((failure as GitHubApiError).messageRef)).not.toContain(sampleToken)
  })

  it('rejects a response that is not a list', async () => {
    stubFetchPages([{ body: { message: 'x' } }])

    const failure = await new GitHubClient(sampleToken)
      .listProjectFields('acme', 3)
      .catch((error: unknown) => error)

    expect(readMessageKey(failure)).toBe('errors.notList')
  })
})
