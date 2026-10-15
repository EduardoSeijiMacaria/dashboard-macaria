import { describe, expect, it } from 'vitest'
import { evaluate } from '../src/rules/engine'
import { defaultConfig } from '../src/services/config'
import type { AuditConfig, AuditIssue } from '../src/types/domain'

function createIssue(milestone?: string): AuditIssue {
  return {
    id: 'I1',
    number: 1,
    url: 'https://example.test/issues/1',
    title: 'Issue',
    state: 'open',
    assignees: [],
    labels: [],
    milestone,
    category: 'other',
    categoryOrigin: 'unclassified',
    createdAt: '2026-10-01T12:00:00Z',
    updatedAt: '2026-10-13T12:00:00Z',
    childIds: [],
    fields: {}
  }
}

function findMilestoneFindings(milestone?: string, config: AuditConfig = defaultConfig) {
  const result = evaluate([createIssue(milestone)], config)
  return result.findings.filter((finding) => finding.field === 'Milestone')
}

const allowedNames = {
  list: ['Quality Assistance 2026', 'Quality Engineering 2026'],
  kind: 'or'
}

describe('milestone rule', () => {
  it('allows the two milestones of 2026', () => {
    expect(defaultConfig.allowedMilestoneNames).toEqual([
      'Quality Assistance 2026',
      'Quality Engineering 2026'
    ])
  })

  it.each([
    ['Quality Assistance 2026'],
    ['Quality Engineering 2026'],
    ['  quality assistance 2026  '],
    ['QUALITY ENGINEERING 2026']
  ])('accepts %j', (milestone) => {
    expect(findMilestoneFindings(milestone)).toEqual([])
  })

  it.each([[undefined], [''], ['   ']])('reports an issue with no milestone (%j)', (milestone) => {
    const [finding, ...otherFindings] = findMilestoneFindings(milestone)

    expect(otherFindings).toEqual([])
    expect(finding.severity).toBe('error')
    expect(finding.explanation).toEqual({ key: 'rules.milestoneMissing' })
    expect(finding.expected).toEqual({
      key: 'rules.milestoneExpected',
      params: { names: allowedNames }
    })
    expect(finding.current).toBeUndefined()
  })

  it.each([['Quality Assistance 2025'], ['Sprint 12'], ['Quality Assistance']])(
    'reports the milestone %j as outside the allowed ones, showing its current value',
    (milestone) => {
      const [finding, ...otherFindings] = findMilestoneFindings(milestone)

      expect(otherFindings).toEqual([])
      expect(finding.current).toBe(milestone)
      expect(finding.explanation).toEqual({
        key: 'rules.milestoneInvalid',
        params: { names: allowedNames }
      })
    }
  )

  it('applies to every issue, whatever its category', () => {
    for (const category of ['task', 'subtask', 'other'] as const) {
      const issue = { ...createIssue(), category }
      const result = evaluate([issue], defaultConfig)

      expect(result.findings.some((finding) => finding.field === 'Milestone')).toBe(true)
    }
  })

  it('reads the allowed names from the config, so next year needs no code change', () => {
    const config: AuditConfig = { ...defaultConfig, allowedMilestoneNames: ['Quality 2027'] }

    expect(findMilestoneFindings('Quality 2027', config)).toEqual([])
    expect(findMilestoneFindings('Quality Assistance 2026', config)).toHaveLength(1)
  })

  it('only requires a milestone when the list of allowed names is empty', () => {
    const config: AuditConfig = { ...defaultConfig, allowedMilestoneNames: [] }

    expect(findMilestoneFindings('Qualquer uma', config)).toEqual([])
    expect(findMilestoneFindings(undefined, config)).toHaveLength(1)
  })

  it('is silent when the rule is disabled', () => {
    const disabledRules = defaultConfig.rules.map((rule) =>
      rule.id === 'MILESTONE-001' ? { ...rule, enabled: false } : rule
    )

    expect(findMilestoneFindings(undefined, { ...defaultConfig, rules: disabledRules })).toEqual([])
  })
})
