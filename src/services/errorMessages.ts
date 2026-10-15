import type { MessageRef } from '../types/domain'
import { AppError } from './appError'

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function toMessageRef(error: unknown): MessageRef {
  if (isAbortError(error)) return { key: 'errors.syncCancelled' }
  if (error instanceof AppError) return error.messageRef
  if (error instanceof Error)
    return { key: 'errors.unexpectedDetail', params: { detail: error.message } }
  return { key: 'errors.unexpected' }
}
