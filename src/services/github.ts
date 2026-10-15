import type { AuditIssue, ClassificationConfig, MessageRef } from '../types/domain'
import { AppError } from './appError'
import { defaultConfig } from './config'
import { isGitHubIssueResponse, toAuditIssue } from './githubIssues'
import {
  toProjectFieldDefinitions,
  toProjectItem,
  type ProjectFieldDefinition,
  type ProjectItem
} from './githubProject'

type WaitFunction = (milliseconds: number, signal?: AbortSignal) => Promise<void>

const maxRetries = 3
const maxWaitSeconds = 30
const issuesPerPage = 100
const githubApiOrigin = 'https://api.github.com'
const apiVersion = '2022-11-28'

type StatusMessages = Partial<Record<number, MessageRef>>

export class GitHubApiError extends AppError {
  constructor(
    messageRef: MessageRef,
    readonly status: number
  ) {
    super(messageRef)
  }
}

export function waitWithAbort(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const createAbortError = () => new DOMException('Aborted', 'AbortError')
    if (signal?.aborted) return reject(createAbortError())
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', cancelWait)
      resolve()
    }, milliseconds)
    function cancelWait(): void {
      clearTimeout(timer)
      reject(createAbortError())
    }
    signal?.addEventListener('abort', cancelWait, { once: true })
  })
}

function readHeaderSeconds(response: Response, headerName: string): number | undefined {
  const rawValue = response.headers.get(headerName)
  if (rawValue === null || rawValue.trim() === '') return undefined
  const seconds = Number(rawValue)
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined
}

function getRetryWaitSeconds(response: Response, retriesDone: number): number | undefined {
  const isServerError = response.status >= 500
  const isRateLimitStatus = response.status === 403 || response.status === 429
  const hasRetryAfter = response.headers.has('Retry-After')
  const hasNoRequestsRemaining = response.headers.get('X-RateLimit-Remaining') === '0'
  const isRateLimitWithHint = isRateLimitStatus && (hasRetryAfter || hasNoRequestsRemaining)
  if (!isServerError && !isRateLimitWithHint) return undefined
  const retryAfterSeconds = readHeaderSeconds(response, 'Retry-After')
  if (retryAfterSeconds !== undefined) return retryAfterSeconds
  const resetEpochSeconds = readHeaderSeconds(response, 'X-RateLimit-Reset')
  if (hasNoRequestsRemaining && resetEpochSeconds !== undefined)
    return Math.max(0, Math.ceil(resetEpochSeconds - Date.now() / 1000))
  return 2 ** retriesDone
}

function createGitHubErrorMessage(response: Response): MessageRef {
  if (response.status === 401) return { key: 'errors.github401' }
  if (response.status === 403) return { key: 'errors.github403' }
  if (response.status === 404) return { key: 'errors.github404' }
  return {
    key: 'errors.githubOther',
    params: { status: response.status, statusText: response.statusText }
  }
}

function readNextPagePath(response: Response): string | undefined {
  const linkHeader = response.headers.get('Link')
  if (!linkHeader) return undefined
  const nextLink = linkHeader.split(',').find((link) => link.includes('rel="next"'))
  const nextUrlMatch = nextLink ? /<([^>]+)>/.exec(nextLink) : null
  if (!nextUrlMatch) return undefined
  const nextUrl = new URL(nextUrlMatch[1])
  if (nextUrl.origin !== githubApiOrigin) {
    throw new AppError({ key: 'errors.foreignLink' })
  }
  return `${nextUrl.pathname}${nextUrl.search}`
}

function createProjectErrorMessages(): StatusMessages {
  return {
    401: { key: 'errors.project401' },
    403: { key: 'errors.project403' },
    404: { key: 'errors.project404' }
  }
}

export class GitHubClient {
  constructor(
    private readonly token: string,
    private readonly wait: WaitFunction = waitWithAbort,
    private readonly classification: ClassificationConfig = defaultConfig.classification
  ) {}

  async listIssues(owner: string, repository: string, signal?: AbortSignal): Promise<AuditIssue[]> {
    const issues: AuditIssue[] = []
    let pageNumber = 1
    while (true) {
      const response = await this.requestJson(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues?state=all&per_page=${issuesPerPage}&page=${pageNumber}`,
        signal
      )
      if (!Array.isArray(response) || !response.every(isGitHubIssueResponse))
        throw new AppError({ key: 'errors.invalidIssues' })
      const issuesOnly = response.filter((issue) => !issue.pull_request)
      issues.push(...issuesOnly.map((issue) => toAuditIssue(issue, this.classification)))
      const isLastPage = response.length < issuesPerPage
      if (isLastPage) return issues
      pageNumber += 1
    }
  }

  async getIssue(
    owner: string,
    repository: string,
    issueNumber: number,
    signal?: AbortSignal
  ): Promise<AuditIssue> {
    const issueMissingMessage: MessageRef = {
      key: 'errors.issueMissing',
      params: { number: issueNumber }
    }
    const response = await this.requestJson(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/${issueNumber}`,
      signal,
      { 404: issueMissingMessage, 410: issueMissingMessage }
    )
    if (!isGitHubIssueResponse(response)) throw new AppError({ key: 'errors.invalidIssue' })
    if (response.pull_request)
      throw new AppError({ key: 'errors.pullRequest', params: { number: issueNumber } })
    return toAuditIssue(response, this.classification)
  }

  async listProjectFields(
    organization: string,
    projectNumber: number,
    signal?: AbortSignal
  ): Promise<ProjectFieldDefinition[]> {
    const fields = await this.requestAllPages(
      `${createProjectPath(organization, projectNumber)}/fields?per_page=${issuesPerPage}`,
      signal,
      createProjectErrorMessages()
    )
    return toProjectFieldDefinitions(fields)
  }

  async listProjectItems(
    organization: string,
    projectNumber: number,
    fieldIds: number[],
    signal?: AbortSignal
  ): Promise<ProjectItem[]> {
    const items = await this.requestAllPages(
      `${createProjectPath(organization, projectNumber)}/items?per_page=${issuesPerPage}&fields=${fieldIds.join(',')}`,
      signal,
      createProjectErrorMessages()
    )
    return items.map(toProjectItem).filter((item): item is ProjectItem => item !== undefined)
  }

  async getProjectItem(
    organization: string,
    projectNumber: number,
    itemId: string,
    fieldIds: number[],
    signal?: AbortSignal
  ): Promise<ProjectItem | undefined> {
    const response = await this.requestJson(
      `${createProjectPath(organization, projectNumber)}/items/${encodeURIComponent(itemId)}?fields=${fieldIds.join(',')}`,
      signal,
      createProjectErrorMessages()
    )
    return toProjectItem(response)
  }

  private async requestAllPages(
    firstPagePath: string,
    signal?: AbortSignal,
    statusMessages: StatusMessages = {}
  ): Promise<unknown[]> {
    const results: unknown[] = []
    let nextPagePath: string | undefined = firstPagePath
    while (nextPagePath) {
      const response = await this.requestResponse(nextPagePath, signal, statusMessages)
      const page: unknown = await response.json()
      if (!Array.isArray(page)) throw new AppError({ key: 'errors.notList' })
      results.push(...page)
      nextPagePath = readNextPagePath(response)
    }
    return results
  }

  private async requestJson(
    path: string,
    signal?: AbortSignal,
    statusMessages: StatusMessages = {}
  ): Promise<unknown> {
    const response = await this.requestResponse(path, signal, statusMessages)
    return response.json()
  }

  private async requestResponse(
    path: string,
    signal: AbortSignal | undefined,
    statusMessages: StatusMessages
  ): Promise<Response> {
    let retriesDone = 0
    while (true) {
      const response = await fetch(`${githubApiOrigin}${path}`, {
        headers: this.createHeaders(),
        signal,
        cache: 'no-store'
      })
      if (response.ok) return response
      const waitSeconds = getRetryWaitSeconds(response, retriesDone)
      if (waitSeconds === undefined) {
        const messageRef = statusMessages[response.status] ?? createGitHubErrorMessage(response)
        throw new GitHubApiError(messageRef, response.status)
      }
      if (waitSeconds > maxWaitSeconds)
        throw new AppError({ key: 'errors.waitTooLong', params: { seconds: maxWaitSeconds } })
      if (retriesDone === maxRetries)
        throw new AppError({ key: 'errors.retriesExhausted', params: { attempts: maxRetries } })
      await this.wait(waitSeconds * 1000, signal)
      retriesDone += 1
    }
  }

  private createHeaders(): HeadersInit {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${this.token}`,
      'X-GitHub-Api-Version': apiVersion
    }
  }
}

function createProjectPath(organization: string, projectNumber: number): string {
  return `/orgs/${encodeURIComponent(organization)}/projectsV2/${projectNumber}`
}
