import { computed, onMounted, ref, toRaw } from 'vue'
import { evaluate } from '../rules/engine'
import { defaultConfig, githubToken, projectNumberSetting, repositoryUrl } from '../services/config'
import { isAbortError, toMessageRef } from '../services/errorMessages'
import { GitHubClient } from '../services/github'
import {
  collectProjectData,
  getFieldStateAfterFailure,
  listCollectedFieldNames,
  markProjectFields,
  mergeProjectFields,
  type ProjectSource
} from '../services/projectFields'
import {
  parseProjectNumber,
  parseRepositoryUrl,
  requireGithubToken
} from '../services/syncSettings'
import type { AuditIssue, Localizable, MessageRef } from '../types/domain'
import { useIssueFilters } from './useIssueFilters'

type Evaluation = ReturnType<typeof evaluate>

export type ConnectionStatus = 'checking' | 'connected' | 'disconnected'

function createGithubClientFromSettings(): {
  client: GitHubClient
  owner: string
  repository: string
  projectSource?: ProjectSource
} {
  const { owner, repository } = parseRepositoryUrl(repositoryUrl)
  const projectNumber = parseProjectNumber(projectNumberSetting)
  const projectSource =
    projectNumber === undefined ? undefined : { organization: owner, projectNumber }
  return {
    client: new GitHubClient(requireGithubToken(githubToken)),
    owner,
    repository,
    projectSource
  }
}

function describeProject(projectSource?: ProjectSource): Localizable {
  if (!projectSource) return { key: 'settings.projectNotConfigured' }
  return `#${projectSource.projectNumber}`
}

function describeUpdateFailure(error: unknown, issueNumber: number): MessageRef {
  if (isAbortError(error)) return { key: 'update.cancelled' }
  return { key: 'update.failed', params: { number: issueNumber, reason: toMessageRef(error) } }
}

export function useAuditDashboard() {
  const issues = ref<AuditIssue[]>([])
  const findings = ref<Evaluation['findings']>([])
  const incomplete = ref<Evaluation['nonEvaluated']>([])
  const selected = ref<AuditIssue>()
  const issueUpdateStatus = ref<MessageRef>()
  const organizationName = ref('')
  const repositoryName = ref('')
  const projectLabel = ref<Localizable>('')
  const projectFailure = ref<MessageRef>()
  const connectionStatus = ref<ConnectionStatus>('checking')
  const syncFailure = ref<MessageRef>()
  const loading = ref(false)
  const isUpdatingIssue = ref(false)
  const lastCollected = ref('')
  let activeRequest: AbortController | undefined

  const repositoryWebUrl = computed(() => {
    if (!organizationName.value || !repositoryName.value) return ''
    return `https://github.com/${organizationName.value}/${repositoryName.value}`
  })

  const { assignees, filtered, filteredFindings, filters, metrics } = useIssueFilters({
    issues,
    findings,
    incomplete,
    lastCollected
  })

  function showEvaluation(auditedIssues: AuditIssue[]): void {
    const collectedAt = new Date().toISOString()
    const evaluation = evaluate(auditedIssues, defaultConfig, collectedAt)
    issues.value = auditedIssues
    findings.value = evaluation.findings
    incomplete.value = evaluation.nonEvaluated
    lastCollected.value = collectedAt
  }

  function clearResults(): void {
    issues.value = []
    findings.value = []
    incomplete.value = []
    selected.value = undefined
    issueUpdateStatus.value = undefined
    lastCollected.value = ''
  }

  async function addProjectFields(
    client: GitHubClient,
    projectSource: ProjectSource | undefined,
    githubIssues: AuditIssue[],
    signal: AbortSignal
  ): Promise<AuditIssue[]> {
    if (!projectSource) return githubIssues
    const fieldNames = listCollectedFieldNames(defaultConfig)
    try {
      const projectData = await collectProjectData(client, projectSource, fieldNames, signal)
      return mergeProjectFields(githubIssues, projectData, fieldNames)
    } catch (error: unknown) {
      if (isAbortError(error)) throw error
      console.error('ProjectFieldsFailed', error)
      projectFailure.value = toMessageRef(error)
      return markProjectFields(githubIssues, fieldNames, getFieldStateAfterFailure(error))
    }
  }

  async function refreshProjectFieldsOfIssue(
    client: GitHubClient,
    projectSource: ProjectSource | undefined,
    issue: AuditIssue,
    projectItemId: string | undefined,
    signal: AbortSignal
  ): Promise<AuditIssue> {
    if (!projectSource) return issue
    const fieldNames = listCollectedFieldNames(defaultConfig)
    const projectData = await collectProjectData(
      client,
      projectSource,
      fieldNames,
      signal,
      projectItemId
    )
    return mergeProjectFields([issue], projectData, fieldNames)[0]
  }

  async function syncGithub(): Promise<void> {
    if (isUpdatingIssue.value) return
    loading.value = true
    syncFailure.value = undefined
    projectFailure.value = undefined
    clearResults()
    activeRequest = new AbortController()
    try {
      const { client, owner, repository, projectSource } = createGithubClientFromSettings()
      organizationName.value = owner
      repositoryName.value = repository
      projectLabel.value = describeProject(projectSource)
      const githubIssues = await client.listIssues(owner, repository, activeRequest.signal)
      connectionStatus.value = 'connected'
      const auditedIssues = await addProjectFields(
        client,
        projectSource,
        githubIssues,
        activeRequest.signal
      )
      showEvaluation(auditedIssues)
    } catch (error: unknown) {
      const isCancelAfterConnection = isAbortError(error) && connectionStatus.value === 'connected'
      if (!isCancelAfterConnection) connectionStatus.value = 'disconnected'
      syncFailure.value = toMessageRef(error)
    } finally {
      loading.value = false
    }
  }

  function cancelSync(): void {
    activeRequest?.abort()
  }

  function closeSelectedIssue(): void {
    selected.value = undefined
  }

  function toggleIssueDetails(issue: AuditIssue): void {
    const isIssueOpen = selected.value?.id === issue.id
    if (isIssueOpen) closeSelectedIssue()
    else selected.value = issue
  }

  function reportIssueUpdate(message: MessageRef): void {
    issueUpdateStatus.value = message
  }

  async function updateSelectedIssue(): Promise<void> {
    const issueToUpdate = selected.value
    if (!issueToUpdate || loading.value) return
    activeRequest = new AbortController()
    isUpdatingIssue.value = true
    try {
      const { client, owner, repository, projectSource } = createGithubClientFromSettings()
      const githubIssue = await client.getIssue(
        owner,
        repository,
        issueToUpdate.number,
        activeRequest.signal
      )
      const freshIssue = await refreshProjectFieldsOfIssue(
        client,
        projectSource,
        githubIssue,
        issueToUpdate.projectItemId,
        activeRequest.signal
      )
      const isIssueStillListed = issues.value.some((issue) => issue.id === freshIssue.id)
      if (!isIssueStillListed) return
      const updatedIssues = toRaw(issues.value).map((issue) =>
        issue.id === freshIssue.id ? freshIssue : issue
      )
      showEvaluation(updatedIssues)
      const isFreshIssueStillSelected = selected.value?.id === freshIssue.id
      if (isFreshIssueStillSelected) selected.value = freshIssue
      reportIssueUpdate({ key: 'update.done', params: { number: freshIssue.number } })
    } catch (error: unknown) {
      reportIssueUpdate(describeUpdateFailure(error, issueToUpdate.number))
    } finally {
      isUpdatingIssue.value = false
    }
  }

  onMounted(syncGithub)

  return {
    assignees,
    cancelSync,
    connectionStatus,
    closeSelectedIssue,
    filtered,
    filteredFindings,
    filters,
    findings,
    incomplete,
    isUpdatingIssue,
    issues,
    issueUpdateStatus,
    lastCollected,
    loading,
    metrics,
    projectFailure,
    projectLabel,
    organizationName,
    repositoryName,
    repositoryWebUrl,
    selected,
    syncFailure,
    syncGithub,
    toggleIssueDetails,
    updateSelectedIssue
  }
}
