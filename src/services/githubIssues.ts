import type { AuditIssue, ClassificationConfig } from '../types/domain'
import { classifyIssue } from './classifyIssue'
import { isRecord } from './typeGuards'

interface GitHubUser {
  login: string
}
interface GitHubLabel {
  name: string
}
interface GitHubMilestone {
  title: string
}

export interface GitHubIssueResponse {
  id: number
  number: number
  html_url: string
  title: string
  body: string | null
  state: 'open' | 'closed'
  assignees: GitHubUser[]
  labels: Array<GitHubLabel | string>
  milestone: GitHubMilestone | null
  type?: unknown
  created_at: string
  updated_at: string
  closed_at: string | null
  pull_request?: unknown
}

export function isGitHubIssueResponse(value: unknown): value is GitHubIssueResponse {
  if (!isRecord(value)) return false
  const hasValidIdentity =
    typeof value.id === 'number' &&
    typeof value.number === 'number' &&
    typeof value.html_url === 'string' &&
    typeof value.title === 'string'
  const hasValidState = value.state === 'open' || value.state === 'closed'
  const hasValidBody = value.body === null || typeof value.body === 'string'
  const hasValidPeople = Array.isArray(value.assignees) && value.assignees.every(isGitHubUser)
  const hasValidLabels = Array.isArray(value.labels) && value.labels.every(isGitHubLabel)
  const hasValidMilestone = value.milestone === null || isGitHubMilestone(value.milestone)
  const hasValidDates =
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string' &&
    (value.closed_at === null || typeof value.closed_at === 'string')
  return (
    hasValidIdentity &&
    hasValidState &&
    hasValidBody &&
    hasValidPeople &&
    hasValidLabels &&
    hasValidMilestone &&
    hasValidDates
  )
}

export function toAuditIssue(
  issue: GitHubIssueResponse,
  classification: ClassificationConfig
): AuditIssue {
  const labels = issue.labels.map(getLabelName)
  const { category, origin } = classifyIssue(readIssueTypeName(issue), labels, classification)
  return {
    id: String(issue.id),
    number: issue.number,
    url: issue.html_url,
    title: issue.title,
    body: issue.body ?? undefined,
    state: issue.state,
    assignees: issue.assignees.map((assignee) => assignee.login),
    labels,
    milestone: issue.milestone?.title,
    category,
    categoryOrigin: origin,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at ?? undefined,
    childIds: [],
    fields: {}
  }
}

function readIssueTypeName(issue: GitHubIssueResponse): string | undefined {
  const issueType = issue.type
  if (!isRecord(issueType) || typeof issueType.name !== 'string') return undefined
  return issueType.name
}

function getLabelName(label: GitHubLabel | string): string {
  return typeof label === 'string' ? label : label.name
}

function isGitHubUser(value: unknown): value is GitHubUser {
  return isRecord(value) && typeof value.login === 'string'
}

function isGitHubLabel(value: unknown): value is GitHubLabel | string {
  return typeof value === 'string' || (isRecord(value) && typeof value.name === 'string')
}

function isGitHubMilestone(value: unknown): value is GitHubMilestone {
  return isRecord(value) && typeof value.title === 'string'
}
