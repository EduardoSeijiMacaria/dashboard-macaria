import type { ProjectValue } from '../types/domain'
import { AppError } from './appError'
import { isRecord } from './typeGuards'

export interface ProjectFieldDefinition {
  id: number
  name: string
  dataType: string
}

export interface ProjectItem {
  itemId: number
  issueId: string
  valuesByFieldId: Map<number, unknown>
}

export function toProjectFieldDefinitions(response: unknown[]): ProjectFieldDefinition[] {
  return response.map((field) => {
    if (!isRecord(field) || !hasFieldIdentity(field)) {
      throw new AppError({ key: 'errors.invalidProjectFields' })
    }
    return { id: field.id, name: field.name, dataType: String(field.data_type) }
  })
}

export function toProjectItem(response: unknown): ProjectItem | undefined {
  if (!isRecord(response) || typeof response.id !== 'number' || !Array.isArray(response.fields)) {
    throw new AppError({ key: 'errors.invalidProjectItems' })
  }
  const content = response.content
  const isIssueItem =
    response.content_type === 'Issue' && isRecord(content) && typeof content.id === 'number'
  if (!isIssueItem) return undefined
  const valuesByFieldId = new Map<number, unknown>()
  for (const field of response.fields) {
    if (!isRecord(field) || typeof field.id !== 'number') {
      throw new AppError({ key: 'errors.invalidProjectItems' })
    }
    valuesByFieldId.set(field.id, field.value)
  }
  return { itemId: response.id, issueId: String(content.id), valuesByFieldId }
}

export function toProjectValue(rawValue: unknown): ProjectValue {
  if (rawValue === null || rawValue === undefined) return { state: 'empty', raw: rawValue }
  const text = readText(rawValue)
  if (text === undefined) return { state: 'error', raw: rawValue }
  return { state: 'value', value: text, raw: rawValue }
}

function readText(rawValue: unknown): string | undefined {
  if (typeof rawValue === 'string') return rawValue
  if (typeof rawValue === 'number') return String(rawValue)
  if (!isRecord(rawValue)) return undefined
  if (typeof rawValue.raw === 'string') return rawValue.raw
  if (isRecord(rawValue.name) && typeof rawValue.name.raw === 'string') return rawValue.name.raw
  return undefined
}

function hasFieldIdentity(
  field: Record<string, unknown>
): field is Record<string, unknown> & { id: number; name: string } {
  return typeof field.id === 'number' && typeof field.name === 'string'
}
