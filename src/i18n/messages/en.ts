import type { MessageSchema } from '../messageKeys'
import type { ptBR } from './pt-BR'

export const en: MessageSchema<typeof ptBR> = {
  app: {
    title: 'Macaria QA — Issue consistency'
  },
  nav: {
    label: 'Pages',
    dashboard: 'Dashboard',
    about: 'About',
    back: '← Back to the dashboard'
  },
  language: {
    label: 'Language'
  },
  theme: {
    useLight: 'Light theme',
    useDark: 'Dark theme'
  },
  connection: {
    checking: '… Connecting',
    connected: '✔ Connected',
    disconnected: '✖ Disconnected'
  },
  labels: {
    organization: 'Organization',
    repository: 'Repository',
    project: 'Project'
  },
  settings: {
    open: 'Settings',
    title: 'Settings',
    closeLabel: 'Close settings',
    closeText: 'Close',
    sectionTitle: 'GitHub connection',
    token: 'GitHub token',
    tokenConfigured: '✔ Configured',
    tokenMissing: '✖ Missing',
    organizationUnknown: 'Not identified',
    repositoryUnknown: 'Not identified',
    projectUnknown: 'Not identified',
    projectNotConfigured: 'not configured',
    projectFailure: '✖ Project fields unavailable: {reason}',
    hint: 'Organization, repository, Project, and token come from the .env file. The tool only reads data from GitHub. After you change the .env file, restart the server or build again.',
    configure: 'Set up connection'
  },
  sourceLabel: 'Data source',
  filters: {
    label: 'Filters',
    search: 'Search',
    searchPlaceholder: 'Number, URL, or title',
    assignee: 'Assignee',
    all: 'All',
    allFeminine: 'All',
    noAssignee: 'No assignee',
    type: 'Issue type',
    severity: 'Severity',
    errors: 'Errors',
    warnings: 'Warnings',
    situation: 'Status',
    withProblems: 'With problems',
    notEvaluated: 'Not evaluated',
    period: 'Period',
    periodDate: 'Date used for the period',
    updatedAt: 'Updated',
    createdAt: 'Created',
    closedAt: 'Closed',
    collectedAt: 'Collected',
    dateFrom: 'Start date',
    dateTo: 'End date'
  },
  summary: {
    label: 'Analysis summary',
    analyzed: 'Issues analyzed',
    withProblems: 'With problems',
    findings: 'Inconsistencies'
  },
  refresh: {
    button: 'Refresh analysis',
    loading: 'Refreshing…',
    cancel: 'Cancel',
    lastUpdate: 'Last update: {date}',
    never: 'Not updated yet'
  },
  results: {
    label: 'Results',
    loading: 'Loading issues from GitHub…',
    noIssues: 'This repository has no issues.',
    noMatch: 'No issues match these filters.'
  },
  table: {
    caption: 'Analyzed issues. Use the title to see the inconsistencies of each issue.',
    number: 'No.',
    title: 'Title',
    assignee: 'Assignee',
    projectStatus: 'Project status',
    problems: 'Problems',
    statusEmpty:
      '{statusField} is empty: it is not possible to know whether it differs from {optionalStatus}.',
    statusNotEvaluated: 'Not evaluated',
    errorCount: '{count} error | {count} errors',
    warningCount: '{count} warning | {count} warnings',
    notEvaluated: 'Not evaluated',
    noProblems: 'No problems'
  },
  severity: {
    error: 'error',
    warning: 'warning',
    info: 'info'
  },
  details: {
    aria: 'Details of issue #{number}',
    type: 'Type: {value}',
    open: 'Open on GitHub',
    update: 'Refresh this issue',
    findingsTitle: 'Inconsistencies ({count})',
    noFindings: 'No problems found in the rules that were evaluated.',
    field: 'Field',
    current: 'Current value',
    expected: 'Expected pattern',
    explanation: 'Explanation',
    suggestion: 'Suggestion: {value}',
    cannotEvaluate: 'Could not evaluate',
    unclassifiedNotice:
      'Issue with no Task or Subtask classification: the title rules were not applied.'
  },
  classification: {
    other: 'Other',
    unclassified: 'Unclassified',
    withOrigin: '{name} ({origin})',
    originType: 'type',
    originLabel: 'label, fallback'
  },
  update: {
    done: 'Issue #{number} refreshed.',
    cancelled: 'Issue refresh cancelled.',
    failed: 'Could not refresh #{number}: {reason}'
  },
  errors: {
    syncCancelled: 'Sync cancelled.',
    unexpected: 'An unexpected error happened.',
    unexpectedDetail: 'An unexpected error happened: {detail}',
    tokenMissing:
      'The GitHub token is not configured. Set GIT_TOKEN in the .env file and restart the server or build again.',
    repositoryMissing: 'The REPOSITORY_URL variable is not configured in the .env file.',
    repositoryInvalid:
      'The REPOSITORY_URL variable is invalid. Use https://github.com/owner/repository or owner/repository.',
    projectNumberInvalid:
      'The PROJECT_NUMBER variable is invalid. Use the Project number, such as 3.',
    github401:
      '401: The GitHub token is invalid or has expired. Create a new token and update GIT_TOKEN in the .env file.',
    github403:
      '403: GitHub denied access. The token may lack read permission for Issues in this repository, or the request limit was reached.',
    github404:
      '404: Repository not found, or the token has no access to it. Check REPOSITORY_URL in the .env file.',
    githubOther: '{status}: {statusText}',
    project401:
      '401: The GitHub token is invalid or has expired. Create a new token and update GIT_TOKEN in the .env file.',
    project403:
      '403: GitHub denied access to the Project. The token needs the organization Projects permission (read-only).',
    project404:
      '404: Project not found, or the token has no access to it. Check PROJECT_NUMBER in the .env file.',
    issueMissing: 'Issue #{number} not found or removed.',
    pullRequest: '#{number} is a pull request, not an issue.',
    invalidIssues: 'The GitHub issues response is invalid.',
    invalidIssue: 'The GitHub issue response is invalid.',
    notList: 'The GitHub response is not a list.',
    waitTooLong: 'GitHub asked for a wait longer than {seconds} seconds. Try again later.',
    retriesExhausted:
      'GitHub kept refusing the requests after {attempts} attempts. Try again later.',
    foreignLink: 'GitHub pointed to a next page at another address. The query was cancelled.',
    invalidProjectFields: 'The GitHub Project fields response is invalid.',
    invalidProjectItems: 'The GitHub Project items response is invalid.'
  },
  availability: {
    'not-queried': 'not queried',
    'no-access': 'no access',
    'not-found': 'not found in the Project',
    'outside-project': 'issue outside the Project',
    'query-failed': 'query failed'
  },
  fields: {
    title: 'Title',
    subtasks: 'Subtasks'
  },
  rules: {
    taskTitleFormat:
      "The title does not follow the proposed format “Prefix {'|'} description YYYY-MM-DD”.",
    taskTitleFormatExpected: "<prefix> {'|'} <description> YYYY-MM-DD",
    taskDateInvalid: 'The final date is missing or is not a valid calendar date.',
    taskDateExpected: 'A valid YYYY-MM-DD date',
    requiredChildren: 'This category is configured to require subtasks.',
    requiredChildrenExpected: 'At least one subtask',
    childrenDone: 'All subtasks are completed, but the task is not {done}.',
    subMarker: 'The MACARIA marker is malformed.',
    subSpacing: 'There is leading/trailing space or a separator without space.',
    subScenarios: 'Use “Scenarios” in the plural.',
    subFormat: 'Title outside the configured formats.',
    ffMissing: 'Applicable {initiative} without {featureFlagName}.',
    ffMissingExpected: '{featureFlagName} filled in, or an exception',
    ffConflict:
      '{featureFlagName} is filled in, which conflicts with {featureFlagStatus} “{noFlag}”.',
    ffSiblings: 'Sibling subtasks have different feature flag values.',
    requiredField: 'Required field not filled in.',
    requiredFieldExpected: 'Field filled in',
    tag: 'Enter the tag, or N/A when there is none.',
    tagExpected: 'Tag or N/A',
    bugs: 'Enter the number of bugs, or 0 when there are none.',
    bugsExpected: 'Number (0 when there are no bugs)',
    startRequired: 'Required field when the {statusField} is different from {optionalStatus}.',
    startExpected: '{field} filled in',
    milestoneMissing: 'Every issue needs a milestone.',
    milestoneInvalid: 'The milestone must be {names}.',
    milestoneExpected: '{names}'
  },
  notEvaluated: {
    requiredFields: 'Required fields',
    cannotRead: 'Could not read: {fields}.',
    fieldWithState: '{name} ({state})',
    statusUnknown:
      '{statusField} {state}: it is not possible to know whether it differs from {optionalStatus}.',
    statusEmpty:
      'Status is empty: it is not possible to know whether it differs from {optionalStatus}.',
    startUnavailable: '{field} {state}.'
  },
  footer: {
    label: 'Footer links',
    text: 'Macaria QA — Issue consistency dashboard',
    openRepository: 'Open repository on GitHub'
  },
  about: {
    lead: 'Issue consistency dashboard',
    intro:
      'Helps the QA team find missing or non-standard information in issues and in GitHub Projects fields. The tool only reads data: it never changes anything on GitHub.',
    featuresTitle: 'What you can do',
    features: {
      queryTitle: 'Query issues and Project',
      queryText: 'Reads the repository issues and the GitHub Project fields.',
      findTitle: 'Find non-standard fields',
      findText: 'Points out empty required fields and titles outside the format.',
      filterTitle: 'Filter the results',
      filterText: 'By assignee, type, severity, status, and period.',
      fixTitle: 'See what to fix',
      fixText: 'Shows the field, the current value, and the expected pattern.'
    },
    usageTitle: 'How to use',
    steps: {
      connectionTitle: 'Check the connection',
      connectionText:
        'The “{settings}” button shows the organization, the repository, and the Project being read.',
      loadTitle: 'Load the data',
      loadText: 'The page reads GitHub when it opens. To read again, click “{refresh}”.',
      filterTitle: 'Filter',
      filterText: 'Use {controls}. In {period}, choose the date to use: {dates}.',
      analyzeTitle: 'Analyze the inconsistencies',
      analyzeText:
        'Click the issue title. The panel shows the field pointed out, the current value, the expected pattern, and the explanation.',
      correctTitle: 'Fix it on GitHub',
      correctText: 'Use “{open}” and fix the information there. The tool does not change issues.',
      checkTitle: 'Check the fix',
      checkText: 'Click “{updateIssue}” (that issue only) or “{refresh}” (all issues).'
    },
    resultsTitle: 'How to read the results',
    resultsIntro: 'Each issue in the table shows one of these states.',
    example: 'Example:',
    stateError: 'Information outside a required rule.',
    stateWarning: 'A situation that needs review.',
    stateNotEvaluated:
      'Data or access was missing for the check. The issue panel gives the reason: field with no access, not found, query failed, or issue outside the Project.',
    stateOk: 'All the applicable rules were evaluated and none found a problem.',
    resultsNote:
      'Titles, field names, and values come from GitHub and appear as text, exactly as they were received.',
    privacyTitle: 'Access and privacy',
    privacy: {
      readOnly: 'Read-only: the tool does not change issues or Projects.',
      direct: 'Queries go from the browser straight to the GitHub API, with no server in between.',
      access:
        'The data shown depends on the read access the team configured. What that access cannot reach appears as “{notEvaluated}”.',
      storage:
        'Nothing is stored in the browser, except the theme and language choice. There is no history.',
      lastUpdate: '“Last update” shows when the data was read. It is not real-time tracking.'
    },
    developerTitle: 'Development and contact',
    developedBy: 'Developed by {name}',
    purpose: 'Purpose: to support QA work in finding inconsistencies in issues.',
    contactInvite: 'Questions, suggestions, problem reports, etc.? Write to',
    contactMissing: 'Contact not configured yet',
    repositoryNote:
      'The analyzed repository is the data source. It is not the developer’s contact channel.'
  }
}
