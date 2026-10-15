import type { AuditIssue } from '../../types/domain'
import { addFinding, getFieldValue, isFieldUnavailable, type RuleContext } from '../context'

const initiativeFieldName = 'Initiative'
const featureFlagNameField = 'FF Name'
const featureFlagStatusField = 'FF Status'
const noFeatureFlagOption = 'No FF'

export function evaluateFieldRules(issue: AuditIssue, context: RuleContext): void {
  const featureFlagName = getFieldValue(issue, featureFlagNameField)
  const featureFlagStatus = getFieldValue(issue, featureFlagStatusField)
  const initiative = getFieldValue(issue, initiativeFieldName)

  const isInitiativeApplicable =
    !isFieldUnavailable(issue, initiativeFieldName) && !isNotApplicable(initiative)
  const isMissingFeatureFlagName = isNotApplicable(featureFlagName)
  if (isInitiativeApplicable && isMissingFeatureFlagName) {
    addFinding(context, issue, 'FF-001', {
      explanation: {
        key: 'rules.ffMissing',
        params: { initiative: initiativeFieldName, featureFlagName: featureFlagNameField }
      },
      field: featureFlagNameField,
      expected: {
        key: 'rules.ffMissingExpected',
        params: { featureFlagName: featureFlagNameField }
      }
    })
  }

  const hasConflictingFeatureFlag =
    !isMissingFeatureFlagName && featureFlagStatus === noFeatureFlagOption
  if (hasConflictingFeatureFlag) {
    addFinding(context, issue, 'FF-002', {
      explanation: {
        key: 'rules.ffConflict',
        params: {
          featureFlagName: featureFlagNameField,
          featureFlagStatus: featureFlagStatusField,
          noFlag: noFeatureFlagOption
        }
      },
      field: featureFlagStatusField,
      current: featureFlagStatus
    })
  }
}

export function evaluateSiblingFeatureFlags(parent: AuditIssue, context: RuleContext): void {
  if (parent.childIds.length === 0) return
  const siblings = parent.childIds
    .map((childId) => context.issuesById.get(childId))
    .filter((issue): issue is AuditIssue => Boolean(issue))
  if (siblings.length < 2 || !hasDivergentFeatureFlag(siblings)) return
  addFinding(context, parent, 'FF-003', {
    explanation: { key: 'rules.ffSiblings' },
    field: `${featureFlagNameField} / ${featureFlagStatusField}`,
    related: siblings.map((sibling) => ({
      issueId: sibling.id,
      value: `${getFieldValue(sibling, featureFlagNameField) ?? '—'} / ${getFieldValue(sibling, featureFlagStatusField) ?? '—'}`
    }))
  })
}

function isNotApplicable(value: string | undefined): boolean {
  return !value || /^(n\/?a|na)$/i.test(value.trim())
}

function hasDivergentFeatureFlag(siblings: AuditIssue[]): boolean {
  return (
    distinctValues(siblings, featureFlagNameField).size > 1 ||
    distinctValues(siblings, featureFlagStatusField).size > 1
  )
}

function distinctValues(issues: AuditIssue[], fieldName: string): Set<string> {
  const filledValues = issues
    .map((issue) => getFieldValue(issue, fieldName))
    .filter((value): value is string => Boolean(value))
  return new Set(filledValues)
}
