import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuditDashboard } from '../src/composables/useAuditDashboard'

const sampleSettings = vi.hoisted(() => ({
  token: 'sample-token-for-tests',
  repository: 'acme/qa-board',
  projectNumber: ''
}))

vi.mock('../src/services/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/services/config')>()),
  get githubToken() {
    return sampleSettings.token
  },
  get repositoryUrl() {
    return sampleSettings.repository
  },
  get projectNumberSetting() {
    return sampleSettings.projectNumber
  }
}))

function createIssueResponse(number: number) {
  return {
    id: number,
    number,
    html_url: `https://example.test/issues/${number}`,
    title: `Issue ${number}`,
    body: null,
    state: 'open',
    assignees: [],
    labels: [],
    milestone: null,
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-02T12:00:00Z',
    closed_at: null
  }
}

function stubFetchWithIssues(issueNumbers: number[]) {
  const fetchSpy = vi.fn(
    async () => new Response(JSON.stringify(issueNumbers.map(createIssueResponse)), { status: 200 })
  )
  vi.stubGlobal('fetch', fetchSpy)
  return fetchSpy
}

describe('useAuditDashboard', () => {
  beforeEach(() => {
    sampleSettings.token = 'sample-token-for-tests'
    sampleSettings.projectNumber = ''
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('evaluates the synced issues and records when they were read', async () => {
    stubFetchWithIssues([1, 2])
    const dashboard = useAuditDashboard()

    await dashboard.syncGithub()

    expect(dashboard.syncFailure.value).toBeUndefined()
    expect(dashboard.issues.value).toHaveLength(2)
    expect(dashboard.lastCollected.value).not.toBe('')
  })

  describe('connection status', () => {
    it('starts as checking, before any answer', () => {
      stubFetchWithIssues([1])
      const dashboard = useAuditDashboard()

      expect(dashboard.connectionStatus.value).toBe('checking')
    })

    it('becomes connected after the GitHub answers', async () => {
      stubFetchWithIssues([1])
      const dashboard = useAuditDashboard()

      await dashboard.syncGithub()

      expect(dashboard.connectionStatus.value).toBe('connected')
    })

    it('becomes disconnected when the token is missing', async () => {
      sampleSettings.token = ''
      const dashboard = useAuditDashboard()

      await dashboard.syncGithub()

      expect(dashboard.connectionStatus.value).toBe('disconnected')
    })

    it('becomes disconnected when the GitHub refuses the token', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response('{}', { status: 401 }))
      )
      const dashboard = useAuditDashboard()

      await dashboard.syncGithub()

      expect(dashboard.connectionStatus.value).toBe('disconnected')
    })

    it('stays connected while a refresh runs and when the user cancels it', async () => {
      stubFetchWithIssues([1])
      const dashboard = useAuditDashboard()
      await dashboard.syncGithub()
      vi.stubGlobal(
        'fetch',
        vi.fn(
          (_url: string, init: RequestInit) =>
            new Promise<Response>((_resolve, reject) => {
              init.signal?.addEventListener('abort', () =>
                reject(new DOMException('Aborted', 'AbortError'))
              )
            })
        )
      )

      const pendingSync = dashboard.syncGithub()
      expect(dashboard.connectionStatus.value).toBe('connected')
      dashboard.cancelSync()
      await pendingSync

      expect(dashboard.connectionStatus.value).toBe('connected')
    })
  })

  it('makes no fetch call when the token is missing', async () => {
    sampleSettings.token = ''
    const fetchSpy = stubFetchWithIssues([1])
    const dashboard = useAuditDashboard()

    await dashboard.syncGithub()

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(dashboard.syncFailure.value).toEqual({ key: 'errors.tokenMissing' })
  })

  it('clears the old rows when a second sync starts and fails', async () => {
    stubFetchWithIssues([1, 2])
    const dashboard = useAuditDashboard()
    await dashboard.syncGithub()
    expect(dashboard.issues.value).toHaveLength(2)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 404 }))
    )

    await dashboard.syncGithub()

    expect(dashboard.issues.value).toHaveLength(0)
    expect(dashboard.findings.value).toHaveLength(0)
    expect(dashboard.syncFailure.value).toEqual({ key: 'errors.github404' })
  })

  describe('conforming issues metric', () => {
    async function syncIssuesWithoutPendingChecks(
      issueOverridesByNumber: Record<number, Record<string, unknown>>
    ) {
      const responseBody = JSON.stringify(
        Object.entries(issueOverridesByNumber).map(([number, overrides]) => ({
          ...createIssueResponse(Number(number)),
          ...overrides
        }))
      )
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(responseBody, { status: 200 }))
      )
      const dashboard = useAuditDashboard()
      await dashboard.syncGithub()
      dashboard.findings.value = []
      dashboard.incomplete.value = []
      return dashboard
    }

    it('counts a Task and a Subtask that have no findings and no unchecked rules', async () => {
      const dashboard = await syncIssuesWithoutPendingChecks({
        1: { type: { name: 'Task' } },
        2: { type: { name: 'Subtask' } }
      })

      expect(dashboard.metrics.value.clean).toBe(2)
    })

    it('never counts an issue without classification or classified as other', async () => {
      const dashboard = await syncIssuesWithoutPendingChecks({
        1: {},
        2: { type: { name: 'Bug' } },
        3: { type: { name: 'Task' } }
      })

      expect(dashboard.metrics.value.clean).toBe(1)
    })

    it('does not count a classified issue that has an unchecked rule', async () => {
      const dashboard = await syncIssuesWithoutPendingChecks({ 1: { type: { name: 'Task' } } })
      dashboard.incomplete.value = [
        { issueId: '1', ruleId: 'FIELD-001', reason: 'Campos não consultados' }
      ] as unknown as typeof dashboard.incomplete.value

      expect(dashboard.metrics.value.clean).toBe(0)
    })

    it('does not count a classified issue that has a finding', async () => {
      const dashboard = await syncIssuesWithoutPendingChecks({ 1: { type: { name: 'Task' } } })
      dashboard.findings.value = [
        { id: 'f1', ruleId: 'DATE-001', severity: 'warning', issueId: '1' }
      ] as unknown as typeof dashboard.findings.value

      expect(dashboard.metrics.value.clean).toBe(0)
    })
  })

  describe('updating the selected issue', () => {
    it('replaces only the selected issue with the fresh copy and keeps it selected', async () => {
      stubFetchWithIssues([1, 2])
      const dashboard = useAuditDashboard()
      await dashboard.syncGithub()
      dashboard.selected.value = dashboard.issues.value[0]
      const fetchSpy = vi.fn(
        async () =>
          new Response(JSON.stringify({ ...createIssueResponse(1), title: 'Novo título' }), {
            status: 200
          })
      )
      vi.stubGlobal('fetch', fetchSpy)

      await dashboard.updateSelectedIssue()

      const requestedUrl = (fetchSpy.mock.calls[0] as unknown as [string])[0]
      expect(requestedUrl).toContain('/repos/acme/qa-board/issues/1')
      expect(dashboard.issues.value.map((issue) => issue.title)).toEqual(['Novo título', 'Issue 2'])
      expect(dashboard.selected.value?.title).toBe('Novo título')
      expect(dashboard.issueUpdateStatus.value).toEqual({
        key: 'update.done',
        params: { number: 1 }
      })
    })

    it('keeps the old issue and says why when the fetch fails', async () => {
      stubFetchWithIssues([1])
      const dashboard = useAuditDashboard()
      await dashboard.syncGithub()
      dashboard.selected.value = dashboard.issues.value[0]
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response('{}', { status: 404 }))
      )

      await dashboard.updateSelectedIssue()

      expect(dashboard.issues.value[0].title).toBe('Issue 1')
      expect(dashboard.issueUpdateStatus.value).toEqual({
        key: 'update.failed',
        params: { number: 1, reason: { key: 'errors.issueMissing', params: { number: 1 } } }
      })
    })

    it('flags the update as running while the request is pending, then clears it', async () => {
      stubFetchWithIssues([1])
      const dashboard = useAuditDashboard()
      await dashboard.syncGithub()
      dashboard.selected.value = dashboard.issues.value[0]
      let finishRequest: (response: Response) => void = () => undefined
      vi.stubGlobal(
        'fetch',
        vi.fn(
          () =>
            new Promise<Response>((resolve) => {
              finishRequest = resolve
            })
        )
      )

      const pendingUpdate = dashboard.updateSelectedIssue()
      expect(dashboard.isUpdatingIssue.value).toBe(true)
      finishRequest(new Response(JSON.stringify(createIssueResponse(1)), { status: 200 }))
      await pendingUpdate

      expect(dashboard.isUpdatingIssue.value).toBe(false)
    })

    it('clears the running flag when the update fails', async () => {
      stubFetchWithIssues([1])
      const dashboard = useAuditDashboard()
      await dashboard.syncGithub()
      dashboard.selected.value = dashboard.issues.value[0]
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response('{}', { status: 404 }))
      )

      await dashboard.updateSelectedIssue()

      expect(dashboard.isUpdatingIssue.value).toBe(false)
    })

    async function loadDashboardWithSelection(issueNumbers: number[]) {
      stubFetchWithIssues(issueNumbers)
      const dashboard = useAuditDashboard()
      await dashboard.syncGithub()
      dashboard.selected.value = dashboard.issues.value[0]
      return dashboard
    }

    function stubPendingFetch() {
      let finishRequest: (response: Response) => void = () => undefined
      const fetchSpy = vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((resolve, reject) => {
            finishRequest = resolve
            init.signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError'))
            )
          })
      )
      vi.stubGlobal('fetch', fetchSpy)
      return { fetchSpy, finishRequest: (response: Response) => finishRequest(response) }
    }

    function createFreshIssueResponse(number: number) {
      return new Response(
        JSON.stringify({ ...createIssueResponse(number), title: 'Novo título' }),
        { status: 200 }
      )
    }

    it('keeps the new selection when the user selects another issue during the update', async () => {
      const dashboard = await loadDashboardWithSelection([1, 2])
      const pendingRequest = stubPendingFetch()

      const pendingUpdate = dashboard.updateSelectedIssue()
      dashboard.selected.value = dashboard.issues.value[1]
      pendingRequest.finishRequest(createFreshIssueResponse(1))
      await pendingUpdate

      expect(dashboard.selected.value?.number).toBe(2)
      expect(dashboard.issues.value[0].title).toBe('Novo título')
    })

    it('keeps the drawer closed when the user closes it during the update', async () => {
      const dashboard = await loadDashboardWithSelection([1])
      const pendingRequest = stubPendingFetch()

      const pendingUpdate = dashboard.updateSelectedIssue()
      dashboard.closeSelectedIssue()
      pendingRequest.finishRequest(createFreshIssueResponse(1))
      await pendingUpdate

      expect(dashboard.selected.value).toBeUndefined()
    })

    it('refuses the update while a sync runs', async () => {
      const dashboard = await loadDashboardWithSelection([1])
      const issueToSelect = dashboard.issues.value[0]
      const pendingRequest = stubPendingFetch()
      const pendingSync = dashboard.syncGithub()
      dashboard.selected.value = issueToSelect

      await dashboard.updateSelectedIssue()
      pendingRequest.finishRequest(new Response('[]', { status: 200 }))
      await pendingSync

      expect(pendingRequest.fetchSpy).toHaveBeenCalledTimes(1)
      expect(dashboard.isUpdatingIssue.value).toBe(false)
      expect(dashboard.issues.value).toHaveLength(0)
    })

    it('refuses a sync while an update runs', async () => {
      const dashboard = await loadDashboardWithSelection([1])
      const pendingRequest = stubPendingFetch()

      const pendingUpdate = dashboard.updateSelectedIssue()
      await dashboard.syncGithub()
      pendingRequest.finishRequest(createFreshIssueResponse(1))
      await pendingUpdate

      expect(pendingRequest.fetchSpy).toHaveBeenCalledTimes(1)
      expect(dashboard.issues.value).toHaveLength(1)
      expect(dashboard.loading.value).toBe(false)
    })

    it('changes nothing when the issue left the list during the update', async () => {
      const dashboard = await loadDashboardWithSelection([1, 2])
      const selectedBeforeUpdate = dashboard.selected.value
      const statusBeforeUpdate = dashboard.issueUpdateStatus.value
      const findingsBeforeUpdate = dashboard.findings.value
      const pendingRequest = stubPendingFetch()

      const pendingUpdate = dashboard.updateSelectedIssue()
      dashboard.issues.value = dashboard.issues.value.filter((issue) => issue.number !== 1)
      pendingRequest.finishRequest(createFreshIssueResponse(1))
      await pendingUpdate

      expect(dashboard.issues.value.map((issue) => issue.number)).toEqual([2])
      expect(dashboard.selected.value).toBe(selectedBeforeUpdate)
      expect(dashboard.issueUpdateStatus.value).toBe(statusBeforeUpdate)
      expect(dashboard.issueUpdateStatus.value).toBeUndefined()
      expect(dashboard.findings.value).toBe(findingsBeforeUpdate)
    })

    it('classifies the replaced issue again', async () => {
      const dashboard = await loadDashboardWithSelection([1])
      expect(dashboard.issues.value[0].categoryOrigin).toBe('unclassified')
      const body = JSON.stringify({ ...createIssueResponse(1), type: { name: 'Task' } })
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(body, { status: 200 }))
      )

      await dashboard.updateSelectedIssue()

      expect([
        dashboard.issues.value[0].category,
        dashboard.issues.value[0].categoryOrigin
      ]).toEqual(['task', 'type'])
      expect([
        dashboard.selected.value?.category,
        dashboard.selected.value?.categoryOrigin
      ]).toEqual(['task', 'type'])
    })

    it('refreshes findings and incomplete checks', async () => {
      const dashboard = await loadDashboardWithSelection([1, 2])
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => createFreshIssueResponse(1))
      )

      await dashboard.updateSelectedIssue()

      expect(dashboard.metrics.value.total).toBe(2)
      expect(dashboard.issueUpdateStatus.value?.key).toBe('update.done')
    })

    it('stops the update on cancel and says so', async () => {
      const dashboard = await loadDashboardWithSelection([1])
      stubPendingFetch()

      const pendingUpdate = dashboard.updateSelectedIssue()
      dashboard.cancelSync()
      await pendingUpdate

      expect(dashboard.issueUpdateStatus.value).toEqual({ key: 'update.cancelled' })
      expect(dashboard.isUpdatingIssue.value).toBe(false)
      expect(dashboard.issues.value[0].title).toBe('Issue 1')
    })

    it('says the issue was not found when the update gets a 404', async () => {
      const dashboard = await loadDashboardWithSelection([1])
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response('{}', { status: 404 }))
      )

      await dashboard.updateSelectedIssue()

      expect(dashboard.issueUpdateStatus.value?.key).toBe('update.failed')
    })

    it('does nothing when no issue is selected', async () => {
      const fetchSpy = stubFetchWithIssues([1])
      const dashboard = useAuditDashboard()

      await dashboard.updateSelectedIssue()

      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })
})

describe('useAuditDashboard with a Project', () => {
  const statusField = { id: 11, name: 'Status', data_type: 'single_select' }
  const tagField = { id: 12, name: 'Tag', data_type: 'text' }

  function createItemResponse(itemId: number, issueId: number, tagText: string | null) {
    return {
      id: itemId,
      content_type: 'Issue',
      content: { id: issueId },
      fields: [
        {
          id: 11,
          name: 'Status',
          data_type: 'single_select',
          value: { id: 'a', name: { raw: 'Done', html: 'Done' } }
        },
        {
          id: 12,
          name: 'Tag',
          data_type: 'text',
          value: tagText === null ? null : { raw: tagText, html: tagText }
        }
      ]
    }
  }

  function stubProjectRoutes(routes: { fields?: Response; items?: Response; item?: Response }) {
    const fetchSpy = vi.fn(async (url: string) => {
      if (url.includes('/projectsV2/3/fields'))
        return routes.fields ?? Response.json([statusField, tagField])
      if (url.includes('/projectsV2/3/items/'))
        return routes.item ?? Response.json(createItemResponse(900, 1, 'v2'))
      if (url.includes('/projectsV2/3/items'))
        return routes.items ?? Response.json([createItemResponse(900, 1, null)])
      if (/\/issues\/\d+$/.test(url)) return Response.json(createIssueResponse(1))
      return Response.json([createIssueResponse(1)])
    })
    vi.stubGlobal('fetch', fetchSpy)
    return fetchSpy
  }

  function requestedUrls(fetchSpy: ReturnType<typeof vi.fn>): string[] {
    return fetchSpy.mock.calls.map((call) => String(call[0]))
  }

  beforeEach(() => {
    sampleSettings.token = 'sample-token-for-tests'
    sampleSettings.projectNumber = '3'
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('gives each issue the Project values, matched by the issue id', async () => {
    stubProjectRoutes({})
    const dashboard = useAuditDashboard()

    await dashboard.syncGithub()

    const [issue] = dashboard.issues.value
    expect(issue.fields.Status.value).toBe('Done')
    expect(issue.fields.Tag.state).toBe('empty')
    expect(issue.projectItemId).toBe('900')
    expect(dashboard.projectLabel.value).toBe('#3')
    expect(dashboard.organizationName.value).toBe('acme')
    expect(dashboard.repositoryName.value).toBe('qa-board')
    expect(dashboard.repositoryWebUrl.value).toBe('https://github.com/acme/qa-board')
    expect(dashboard.projectFailure.value).toBeUndefined()
  })

  it('reports an empty required field of the Project with its real name', async () => {
    stubProjectRoutes({})
    const dashboard = useAuditDashboard()

    await dashboard.syncGithub()

    const tagFinding = dashboard.findings.value.find((finding) => finding.field === 'Tag')
    expect(tagFinding?.explanation).toEqual({ key: 'rules.tag' })
  })

  it('asks only for the fields it needs', async () => {
    const fetchSpy = stubProjectRoutes({})
    const dashboard = useAuditDashboard()

    await dashboard.syncGithub()

    const itemsUrl = requestedUrls(fetchSpy).find((url) => url.includes('/projectsV2/3/items'))
    expect(itemsUrl).toContain('fields=11,12')
  })

  it('keeps the issues and marks the Project fields as no access when the token lacks the permission', async () => {
    stubProjectRoutes({ fields: new Response('{}', { status: 403 }) })
    const dashboard = useAuditDashboard()

    await dashboard.syncGithub()

    expect(dashboard.syncFailure.value).toBeUndefined()
    expect(dashboard.issues.value).toHaveLength(1)
    expect(dashboard.issues.value[0].fields.Status.state).toBe('unavailable')
    expect(dashboard.projectFailure.value).toEqual({ key: 'errors.project403' })
    expect(dashboard.findings.value.some((finding) => finding.field === 'Tag')).toBe(false)
    expect(dashboard.incomplete.value.length).toBeGreaterThan(0)
  })

  it('marks the Project fields as a query error when the Project call fails with a server error', async () => {
    stubProjectRoutes({ fields: new Response('{}', { status: 400 }) })
    const dashboard = useAuditDashboard()

    await dashboard.syncGithub()

    expect(dashboard.issues.value[0].fields.Status.state).toBe('error')
  })

  it('does not call the Project when the Project number is not configured', async () => {
    sampleSettings.projectNumber = ''
    const fetchSpy = stubProjectRoutes({})
    const dashboard = useAuditDashboard()

    await dashboard.syncGithub()

    expect(requestedUrls(fetchSpy).some((url) => url.includes('projectsV2'))).toBe(false)
    expect(dashboard.projectLabel.value).toEqual({ key: 'settings.projectNotConfigured' })
  })

  it('shows an invalid Project number as a sync failure', async () => {
    sampleSettings.projectNumber = 'abc'
    stubProjectRoutes({})
    const dashboard = useAuditDashboard()

    await dashboard.syncGithub()

    expect(dashboard.syncFailure.value).toEqual({ key: 'errors.projectNumberInvalid' })
  })

  it('refreshes the Project values of the selected issue by its item id', async () => {
    const fetchSpy = stubProjectRoutes({})
    const dashboard = useAuditDashboard()
    await dashboard.syncGithub()
    dashboard.selected.value = dashboard.issues.value[0]

    await dashboard.updateSelectedIssue()

    expect(requestedUrls(fetchSpy).some((url) => url.includes('/projectsV2/3/items/900'))).toBe(
      true
    )
    expect(dashboard.issues.value[0].fields.Tag.value).toBe('v2')
    expect(dashboard.findings.value.some((finding) => finding.field === 'Tag')).toBe(false)
  })

  it('keeps the old issue when the Project part of the update fails', async () => {
    stubProjectRoutes({})
    const dashboard = useAuditDashboard()
    await dashboard.syncGithub()
    dashboard.selected.value = dashboard.issues.value[0]
    stubProjectRoutes({ fields: new Response('{}', { status: 403 }) })

    await dashboard.updateSelectedIssue()

    expect(dashboard.issueUpdateStatus.value).toEqual({
      key: 'update.failed',
      params: { number: 1, reason: { key: 'errors.project403' } }
    })
    expect(dashboard.issues.value[0].fields.Tag.state).toBe('empty')
  })
})
