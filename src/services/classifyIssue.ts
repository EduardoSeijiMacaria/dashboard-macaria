import type { Category, ClassificationConfig, ClassificationOrigin } from '../types/domain'

export interface Classification {
  category: Category
  origin: ClassificationOrigin
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

function classifyByTypeName(typeName: string, config: ClassificationConfig): Classification {
  const normalizedTypeName = normalizeName(typeName)
  if (normalizedTypeName === normalizeName(config.taskTypeName))
    return { category: 'task', origin: 'type' }
  if (normalizedTypeName === normalizeName(config.subtaskTypeName))
    return { category: 'subtask', origin: 'type' }
  return { category: 'other', origin: 'type' }
}

function classifyByLabels(labels: string[], config: ClassificationConfig): Classification {
  const normalizedLabels = labels.map(normalizeName)
  const hasTaskLabel = normalizedLabels.includes(normalizeName(config.taskLabelName))
  const hasSubtaskLabel = normalizedLabels.includes(normalizeName(config.subtaskLabelName))
  if (hasTaskLabel && !hasSubtaskLabel) return { category: 'task', origin: 'label' }
  if (hasSubtaskLabel && !hasTaskLabel) return { category: 'subtask', origin: 'label' }
  return { category: 'other', origin: 'unclassified' }
}

export function classifyIssue(
  typeName: string | undefined,
  labels: string[],
  config: ClassificationConfig
): Classification {
  const hasType = typeName !== undefined && normalizeName(typeName) !== ''
  if (hasType) return classifyByTypeName(typeName, config)
  return classifyByLabels(labels, config)
}
