import type { MessageRef } from '../types/domain'

export class AppError extends Error {
  constructor(readonly messageRef: MessageRef) {
    super(messageRef.key)
  }
}
