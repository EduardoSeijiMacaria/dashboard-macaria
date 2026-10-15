import type { AuditConfig, AuditIssue, FieldState, ProjectValue } from '../types/domain'
import { GitHubApiError, type GitHubClient } from './github'
import type { ProjectFieldDefinition, ProjectItem } from './githubProject'
import { toProjectValue } from './githubProject'

export interface ProjectData {
  fieldDefinitions: ProjectFieldDefinition[]
  items: ProjectItem[]
}

export interface ProjectSource {
  organization: string
  projectNumber: number
}

const statusCodesWithoutAccess = [401, 403, 404]

export function listCollectedFieldNames(config: AuditConfig): string[] {
  const requiredNames = config.requiredFields.map((field) => field.name)
  return [...new Set([...requiredNames, config.startDate.fieldName, ...config.optionalFieldNames])]
}

export async function collectProjectData(
  client: GitHubClient,
  source: ProjectSource,
  fieldNames: string[],
  signal?: AbortSignal,
  singleItemId?: string
): Promise<ProjectData> {
  const { organization, projectNumber } = source
  const fieldDefinitions = await client.listProjectFields(organization, projectNumber, signal)
  const fieldIds = fieldDefinitions
    .filter((definition) => fieldNames.includes(definition.name))
    .map((definition) => definition.id)
  if (singleItemId === undefined) {
    const items = await client.listProjectItems(organization, projectNumber, fieldIds, signal)
    return { fieldDefinitions, items }
  }
  const item = await client.getProjectItem(
    organization,
    projectNumber,
    singleItemId,
    fieldIds,
    signal
  )
  return { fieldDefinitions, items: item ? [item] : [] }
}

export function mergeProjectFields(
  issues: AuditIssue[],
  projectData: ProjectData,
  fieldNames: string[]
): AuditIssue[] {
  const itemsByIssueId = new Map(projectData.items.map((item) => [item.issueId, item]))
  const definitionsByName = new Map(
    projectData.fieldDefinitions.map((definition) => [definition.name, definition])
  )
  return issues.map((issue) => {
    const item = itemsByIssueId.get(issue.id)
    if (!item) return { ...issue, fields: createFields(fieldNames, { state: 'outside-project' }) }
    const fields: Record<string, ProjectValue> = {}
    for (const fieldName of fieldNames) {
      fields[fieldName] = readFieldValue(item, definitionsByName.get(fieldName))
    }
    return { ...issue, projectItemId: String(item.itemId), fields }
  })
}

export function markProjectFields(
  issues: AuditIssue[],
  fieldNames: string[],
  state: FieldState
): AuditIssue[] {
  return issues.map((issue) => ({ ...issue, fields: createFields(fieldNames, { state }) }))
}

function readFieldValue(item: ProjectItem, definition?: ProjectFieldDefinition): ProjectValue {
  if (!definition) return { state: 'unconfigured' }
  if (!item.valuesByFieldId.has(definition.id)) return { state: 'error' }
  return toProjectValue(item.valuesByFieldId.get(definition.id))
}

function createFields(fieldNames: string[], value: ProjectValue): Record<string, ProjectValue> {
  const fields: Record<string, ProjectValue> = {}
  for (const fieldName of fieldNames) fields[fieldName] = { ...value }
  return fields
}

export function getFieldStateAfterFailure(error: unknown): FieldState {
  const hasNoAccess =
    error instanceof GitHubApiError && statusCodesWithoutAccess.includes(error.status)
  return hasNoAccess ? 'unavailable' : 'error'
}
