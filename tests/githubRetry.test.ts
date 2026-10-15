import { afterEach, describe, expect, it, vi } from 'vitest'
import { GitHubClient, waitWithAbort } from '../src/services/github'
import { readMessageKey, readMessageParams } from './support/messageKey'

const sampleToken = 'sample-token-for-tests'

function createResponse(status: number, headers: Record<string, string> = {}): Response {
  return new Response(status === 200 ? '[]' : '{}', { status, headers })
}

function stubFetchSequence(responses: Response[]) {
  const fetchSpy = vi.fn(async () => responses.shift() ?? createResponse(200))
  vi.stubGlobal('fetch', fetchSpy)
  return fetchSpy
}

function createWaitSpy() {
  return vi.fn(async (_milliseconds: number, _signal?: AbortSignal) => undefined)
}

function listIssuesWith(
  wait: (milliseconds: number, signal?: AbortSignal) => Promise<void>,
  signal?: AbortSignal
) {
  return new GitHubClient(sampleToken, wait).listIssues('acme', 'qa-board', signal)
}

describe('GitHubClient retry', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it.each([[403], [429]])('waits for Retry-After on %i and then succeeds', async (status) => {
    const fetchSpy = stubFetchSequence([
      createResponse(status, { 'Retry-After': '7' }),
      createResponse(200)
    ])
    const wait = createWaitSpy()

    expect(await listIssuesWith(wait)).toEqual([])
    expect(wait).toHaveBeenCalledTimes(1)
    expect(wait.mock.calls[0][0]).toBe(7000)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('retries a 5xx response and then succeeds', async () => {
    const fetchSpy = stubFetchSequence([createResponse(502), createResponse(200)])
    const wait = createWaitSpy()

    expect(await listIssuesWith(wait)).toEqual([])
    expect(wait).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('waits until the rate limit resets when no requests remain', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-14T12:00:00Z'))
    const resetEpochSeconds = Date.parse('2026-10-14T12:00:20Z') / 1000
    stubFetchSequence([
      createResponse(403, {
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(resetEpochSeconds)
      }),
      createResponse(200)
    ])
    const wait = createWaitSpy()

    await listIssuesWith(wait)

    expect(wait.mock.calls[0][0]).toBe(20000)
  })

  it.each([[401], [404]])('does not retry %i', async (status) => {
    const fetchSpy = stubFetchSequence([createResponse(status, { 'Retry-After': '1' })])
    const wait = createWaitSpy()

    const failure = await listIssuesWith(wait).catch((error: Error) => error)

    expect(readMessageKey(failure)).toBe(`errors.github${status}`)
    expect(wait).not.toHaveBeenCalled()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('does not retry a 403 without a wait hint', async () => {
    const fetchSpy = stubFetchSequence([createResponse(403)])
    const wait = createWaitSpy()

    const failure = await listIssuesWith(wait).catch((error: Error) => error)

    expect(readMessageKey(failure)).toBe('errors.github403')
    expect(wait).not.toHaveBeenCalled()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('does not retry a 403 that still has requests remaining', async () => {
    stubFetchSequence([createResponse(403, { 'X-RateLimit-Remaining': '12' })])
    const wait = createWaitSpy()

    await listIssuesWith(wait).catch(() => undefined)

    expect(wait).not.toHaveBeenCalled()
  })

  it('stops after 3 retries with the retries-exhausted message', async () => {
    const fetchSpy = stubFetchSequence(
      [500, 500, 500, 500, 500].map((status) => createResponse(status))
    )
    const wait = createWaitSpy()

    const failure = await listIssuesWith(wait).catch((error: Error) => error)

    expect(fetchSpy).toHaveBeenCalledTimes(4)
    expect(wait).toHaveBeenCalledTimes(3)
    expect(readMessageKey(failure)).toBe('errors.retriesExhausted')
    expect(readMessageParams(failure)).toEqual({ attempts: 3 })
    expect(
      JSON.stringify((failure as unknown as { messageRef: unknown }).messageRef)
    ).not.toContain(sampleToken)
  })

  it('fails without waiting when one wait would pass 30 seconds', async () => {
    const fetchSpy = stubFetchSequence([createResponse(429, { 'Retry-After': '31' })])
    const wait = createWaitSpy()

    const failure = await listIssuesWith(wait).catch((error: Error) => error)

    expect(readMessageKey(failure)).toBe('errors.waitTooLong')
    expect(readMessageParams(failure)).toEqual({ seconds: 30 })
    expect(wait).not.toHaveBeenCalled()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('allows a wait of exactly 30 seconds', async () => {
    stubFetchSequence([createResponse(429, { 'Retry-After': '30' }), createResponse(200)])
    const wait = createWaitSpy()

    await listIssuesWith(wait)

    expect(wait.mock.calls[0][0]).toBe(30000)
  })

  it('falls back to a short wait when Retry-After is not a number', async () => {
    stubFetchSequence([createResponse(503, { 'Retry-After': 'soon' }), createResponse(200)])
    const wait = createWaitSpy()

    await listIssuesWith(wait)

    expect(wait.mock.calls[0][0]).toBeGreaterThan(0)
    expect(wait.mock.calls[0][0]).toBeLessThanOrEqual(30000)
  })

  it('stops requesting when the wait is aborted', async () => {
    const fetchSpy = stubFetchSequence([createResponse(503), createResponse(200)])
    const wait = vi.fn(async () => {
      throw new DOMException('Aborted', 'AbortError')
    })

    const failure = await listIssuesWith(wait).catch((error: Error) => error)

    expect((failure as DOMException).name).toBe('AbortError')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })
})

describe('waitWithAbort', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves after the delay', async () => {
    vi.useFakeTimers()
    const waiting = waitWithAbort(5000)
    await vi.advanceTimersByTimeAsync(5000)
    await expect(waiting).resolves.toBeUndefined()
  })

  it('rejects at once when the signal aborts during the wait', async () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    const waiting = waitWithAbort(5000, controller.signal)
    controller.abort()
    await expect(waiting).rejects.toMatchObject({ name: 'AbortError' })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('rejects without waiting when the signal is already aborted', async () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    controller.abort()
    await expect(waitWithAbort(5000, controller.signal)).rejects.toMatchObject({
      name: 'AbortError'
    })
    expect(vi.getTimerCount()).toBe(0)
  })
})
