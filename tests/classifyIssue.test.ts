import { describe, expect, it } from 'vitest'
import { classifyIssue } from '../src/services/classifyIssue'
import type { ClassificationConfig } from '../src/types/domain'

const classificationConfig: ClassificationConfig = {
  taskTypeName: 'Task',
  subtaskTypeName: 'Subtask',
  taskLabelName: 'task',
  subtaskLabelName: 'subtask'
}

describe('classifyIssue', () => {
  it.each([
    ['type Task', 'Task', [], 'task', 'type'],
    ['type Subtask', 'Subtask', [], 'subtask', 'type'],
    ['type with extra spaces and different case', '  sUbTaSk  ', [], 'subtask', 'type'],
    ['type unknown', 'Bug', [], 'other', 'type'],
    ['type unknown ignores a matching label', 'Bug', ['task'], 'other', 'type'],
    ['type wins over a conflicting label', 'Task', ['subtask'], 'task', 'type'],
    ['no type and the task label', undefined, ['task'], 'task', 'label'],
    [
      'no type and the subtask label with other case and spaces',
      undefined,
      [' SubTask '],
      'subtask',
      'label'
    ],
    ['no type and both labels', undefined, ['task', 'subtask'], 'other', 'unclassified'],
    ['no type and no labels', undefined, [], 'other', 'unclassified'],
    ['no type and unrelated labels', undefined, ['bug'], 'other', 'unclassified'],
    ['blank type name counts as no type', '   ', ['task'], 'task', 'label']
  ])('%s', (_caseName, typeName, labels, expectedCategory, expectedOrigin) => {
    const classification = classifyIssue(typeName, labels, classificationConfig)
    expect(classification).toEqual({ category: expectedCategory, origin: expectedOrigin })
  })

  it('reads every name from the config', () => {
    const portugueseConfig: ClassificationConfig = {
      taskTypeName: 'Tarefa',
      subtaskTypeName: 'Subtarefa',
      taskLabelName: 'tarefa',
      subtaskLabelName: 'subtarefa'
    }
    expect(classifyIssue('Tarefa', [], portugueseConfig)).toEqual({
      category: 'task',
      origin: 'type'
    })
    expect(classifyIssue(undefined, ['subtarefa'], portugueseConfig)).toEqual({
      category: 'subtask',
      origin: 'label'
    })
  })
})
