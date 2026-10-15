export function readMessageKey(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const messageRef = (error as { messageRef?: { key?: string } }).messageRef
  return messageRef?.key
}

export function readMessageParams(error: unknown): Record<string, unknown> | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const messageRef = (error as { messageRef?: { params?: Record<string, unknown> } }).messageRef
  return messageRef?.params
}

export function captureError(action: () => unknown): unknown {
  try {
    action()
  } catch (error) {
    return error
  }
  return undefined
}
