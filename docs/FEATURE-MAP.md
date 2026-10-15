# Feature Map

> Auto-maintained index of every user-facing feature and the code path that implements it. Updated alongside the code — not after the fact.

## Sincronizar com GitHub

Reads all issues of the repository named in `.env` from the GitHub REST API, adds the custom fields of the organization Project named by `PROJECT_NUMBER`, and audits them. Pull requests are excluded. The sync runs when the page opens and again on "Atualizar análise". The user types no token and no repository. The page shows loading, empty, and error states, and never shows rows from an earlier sync.

**Flow:**

1. `vite.config.ts` — `loadEnv` reads `GIT_TOKEN`, `REPOSITORY_URL`, and `PROJECT_NUMBER` from `.env`; `define` embeds only those three values in the build
2. `src/services/config.ts` — exports `githubToken`, `repositoryUrl`, and `projectNumberSetting` from the embedded values
3. `src/views/DashboardView.vue` — page open (through `onMounted`) and "Atualizar análise" call `syncGithub`
4. `src/composables/useAuditDashboard.ts` — `syncGithub` clears old results, then calls `parseRepositoryUrl`, `parseProjectNumber`, and `requireGithubToken`, and builds a `GitHubClient`
5. `src/services/syncSettings.ts` — `parseRepositoryUrl` returns owner and repository; `parseProjectNumber` reads the Project number (empty means no Project); `requireGithubToken` rejects an empty token before any API call
6. `src/services/github.ts` — `listIssues` pages through `/repos/{owner}/{repo}/issues` (100 per page), drops pull requests, and maps each issue with no fields (category comes from step 7); 401, 403, and 404 get their own Portuguese messages; 403 or 429 with a wait hint, and 5xx, retry up to 3 times (single wait capped at 30 seconds), and "Cancelar" stops the wait
6a. `src/services/github.ts` and `src/services/githubProject.ts` — when a Project is set, `listProjectFields` and `listProjectItems` read `/orgs/{org}/projectsV2/{n}/fields` and `/items` (100 per page, following the `Link` header, and refusing a link outside `api.github.com`); the items request lists the wanted field IDs in `fields`, because the default response has only the title; only items of type `Issue` are kept
6b. `src/services/projectFields.ts` — `mergeProjectFields` relates each item to its issue by `content.id` (never by the item ID), reads each value (`value: null` is empty; text, option, and number shapes are read; an unknown shape is a query failure), and marks an issue with no item as outside the Project; only the fields in `listCollectedFieldNames` are collected, so the separator fields never enter
7. `src/services/classifyIssue.ts` — `classifyIssue` picks the category: native type first, then the fallback labels; names come from `defaultConfig.classification`
8. `src/composables/useAuditDashboard.ts` — `showEvaluation` passes the issues to the rule engine and keeps issues, findings, and the collection time in memory
9. `src/rules/engine.ts` — `evaluate` runs task or subtask rules by category, then field rules; rules that need Project fields report not-evaluated
10. `src/views/DashboardView.vue` — shows the repository name, then the loading, error, empty, or table state

**Project access failure:** when the Project call fails, the sync still shows the issues. A 401, 403, or 404 marks the Project fields as no access; any other failure marks them as a query failure. The rules then report not-evaluated, never empty, and the "Conexão" panel shows the reason (`projectFailure`).

**Branch:** "Cancelar" calls `cancelSync`, which aborts the request. `syncGithub` then shows "Sincronização cancelada." as the error state. A missing token, a missing or invalid repository, and API errors take the same path: `syncFailure` holds the message and the table stays hidden.

---

## Classificar issues

Marks each issue as Task, Subtask, or Outro. The native GitHub issue type decides first. A repository with no types uses a label fallback (default labels "task" and "subtask"). An issue with both labels, or none, stays "Sem classificação". The table and the drawer show the category and its origin: "Task (tipo)", "Task (label, alternativa)", "Sem classificação".

**Flow:**

1. `src/services/config.ts` — `defaultConfig.classification` holds the type names and the fallback label names
2. `src/services/githubIssues.ts` — `toAuditIssue` reads `type.name` (null or missing means no type) and calls `classifyIssue`
3. `src/services/classifyIssue.ts` — `classifyIssue` compares names without case or edge spaces and returns the category and its origin
4. `src/rules/engine.ts` — `evaluateIssue` runs task or subtask rules for the category
5. `src/components/IssueDetails.vue` — `describeClassification` writes the Portuguese text in the issue panel; the category filter in `FilterBar.vue` uses `category`

**Branch:** the type wins over a conflicting label. A type that matches neither name gives `other` with origin `type`, and labels are not checked.

---

## Filtrar issues

Narrows the table by assignee, issue type, situation (all, with problems, not evaluated), severity, text, and date range. Date filters use `America/Sao_Paulo`.

**Flow:**

1. `src/components/FilterBar.vue` — inputs bind to `filters` with `v-model`; `DashboardView.vue` passes the model
2. `src/services/config.ts` — `defaultFilters` sets the starting values
3. `src/composables/useAuditDashboard.ts` — the `filtered` computed runs `matchesFilters` (`src/services/filterIssues.ts`) on each issue
4. `src/services/dates.ts` — `inInclusiveRange` compares calendar dates
5. `src/views/DashboardView.vue` — the table shows the matching issues

---

## Apontamentos de consistência

Shows the findings for each issue as severity badges in the table, and as a table of real field names with a message in the issue panel. The interface never shows rule IDs.

**Flow:**

1. `src/composables/useAuditDashboard.ts` — `showEvaluation` calls `evaluate` with `defaultConfig`
2. `src/services/config.ts` — `defaultConfig.rules` sets which rules are enabled and their severity
3. `src/rules/engine.ts` — `evaluate` runs task or subtask rules, then field rules, then the sibling feature-flag check
4. `src/rules/validators/taskRules.ts`, `subtaskRules.ts`, `fieldRules.ts`, `requiredFieldRules.ts` — each rule calls `addFinding` or `addNonEvaluated`
5. `src/rules/context.ts` — `addFinding` drops disabled rules and builds the finding ID
6. `src/components/IssueTable.vue` and `IssueDetails.vue` — show `SeverityBadge` items (icon and severity label, or a count) in the "Problemas" column; the findings table shows the field name, current value, expected pattern, and message

**Required Project fields:** FIELD-001 reports each empty required field as its own error, with the real field name. The fields and their messages come from `defaultConfig.requiredFields` (Status, Tag, QA Apply, QA Early, Test Mode, Dev Docs, Initiative, Team, FF Name, FF Status, Bugs Sbx, Bugs Stg, Bugs Prod). The values `0`, `Yes`, `No`, and `N/A` count as filled. FIELD-002 requires `Start` when the Status is not `Todo`; it creates no finding for a filled Start in `Todo`. A field that is not queried, has no access, is not found, or failed to load is not-evaluated, never empty, and the reason names which case it is. An unavailable or empty Status leaves the Start check not-evaluated. `Execution Time`, `End`, `Release date`, and the separator fields (`defaultConfig.ignoredFieldNames`) create no finding. Until the Project fields are fetched, both rules report not-evaluated for every issue.

**Milestone:** MILESTONE-001 reports an issue with no milestone, and an issue whose milestone is not one of `defaultConfig.allowedMilestoneNames` (today `Quality Assistance 2026` and `Quality Engineering 2026`; the match ignores case and edge spaces). The rule runs on every issue, whatever its category. The milestone is read from the issue (`milestone.title`), so it is never "not evaluated". `src/rules/validators/milestoneRules.ts` holds the rule.

**Pending:** whether `End` and `Release date` are required, and whether a filled `Start` in `Todo` is forbidden.

**Branch:** the app saves no history. Each sync evaluates again from the API data.

---

## Detalhe da issue

Expands a row under the issue title. The panel lists each finding (field or rule, current value, expected pattern, explanation), the checks that could not run, and a link to the issue on GitHub. One row is open at a time.

**Flow:**

1. `src/components/IssueTable.vue` — the title button emits `select`; `DashboardView.vue` toggles `selected`
2. `src/composables/useAuditDashboard.ts` — `selected` holds the issue; `findings` and `incomplete` hold the checks
3. `src/components/IssueDetails.vue` — renders the findings table, the not-evaluated list, the GitHub link, and the category; "Atualizar esta issue" calls `updateSelectedIssue` (disabled during a sync or an update), and the panel shows `issueUpdateStatus`
4. `src/composables/useAuditDashboard.ts` — `updateSelectedIssue` fetches the one issue, swaps it into `issues`, and re-evaluates in memory with `showEvaluation`; it keeps the selection the user has now
5. `src/services/github.ts` — `getIssue` reads `/repos/{owner}/{repo}/issues/{number}`, rejects pull requests, answers 404 and 410 with an issue message, and classifies like the list path
6. `src/composables/useAuditDashboard.ts` — with a Project set, `refreshProjectFieldsOfIssue` reads the field definitions and the one item (`getProjectItem`, by the saved `projectItemId`; without it, the item list) and merges them into the fresh issue

**Branch:** a failed or cancelled update keeps the old issue and writes the reason in the status line. "Cancelar" stops an update as it stops a sync. A sync and an update never run together. A failure in the Project part fails the whole update and keeps the old issue. The update does not fetch relations.

---

## Indicadores de resumo

Shows one line of counts above the table: issues analyzed, issues with problems, and total findings. Each table row also shows its own state: problem counts by severity, "Não avaliada", or "Sem problemas".

**Flow:**

1. `src/composables/useAuditDashboard.ts` — `metrics` computed calls `calculateMetrics` (`src/services/calculateMetrics.ts`) on the filtered issues
2. `src/views/DashboardView.vue` — passes `metrics.total`, `errors + warnings`, and `findings` to `SummaryBar`
3. `src/services/issueAuditState.ts` — `getIssueAuditState` gives each row `problems`, `not-evaluated` (an unchecked rule, or category Outro), or `clean`
4. `src/components/IssueTable.vue` — renders the state as a badge with icon and text

---

## Página Sobre

Presents the tool in Portuguese in six blocks: an introduction, four capability cards, six numbered steps, the result states, a compact "Acesso e privacidade" block, and a developer card. The page is for people who open the dashboard, so it holds no publisher detail (no `.env`, token, or permission text). It has no form, no backend, and no analytics. The page opens at `#/sobre`. A hash link works on any static host and survives a refresh.

**Flow:**

1. `src/composables/useCurrentPage.ts` — `readPageFromHash` maps `#/sobre` to `about` and anything else to `dashboard`; `useCurrentPage` listens to `hashchange` and scrolls to the top
2. `src/views/DashboardView.vue` — keeps the dashboard `main` mounted and hides it with `v-show` while About shows, so filters, loaded data, and the in-memory token stay as they were and no request is made
3. `src/views/AboutView.vue` — the content; the capability cards are only features that exist (read issues and Project, find fields outside the standard, filter, show what to fix); the result states reuse `SeverityBadge` and the "Sem problemas" badge, so they look like the table; the first step points to the "Configurações" button; focus moves to the page title when it opens
4. `src/components/AppIcon.vue` — inline SVG icons (no icon library is installed)
5. `src/services/developerInfo.ts` — `developerInfo` holds the developer name and an optional contact channel; `findUsableContact` accepts only `https:` and `mailto:` links

**Contact:** `developerInfo` in `src/services/developerInfo.ts` credits "QA Macaria" and sets the contact (`name`, `url`, and an optional `display` text). Today it is the e-mail `eduardo.castro@frenet.com.br`, shown as "Contato por e-mail:" with a button-like `mailto:` link. With no contact, the card shows "Contato ainda não configurado" and no link. The analyzed repository is the data source, not the contact channel.

**Branch:** an unsafe contact address (for example `javascript:`) is logged and treated as not configured.

---

## Cabeçalho, conexão e configurações

The header puts navigation first: "Macaria QA" (a link to the dashboard), then "Dashboard" and "Sobre" with the open page marked (`aria-current` and an underline). On the right it shows a discreet connection text, the theme button, and a "Configurações" button (`AppIcon` gear and text; icon only on small screens, with the accessible name kept). A compact line above the filters shows the organization, the repository, and the Project. "Configurações" opens a side panel with the full connection details. The footer has a discreet text and a link to the configured repository. Neither the header, the panel, nor the footer calls the API.

**Flow:**

1. `src/composables/useAuditDashboard.ts` — `syncGithub` sets `organizationName`, `repositoryName`, and `projectLabel`; `connectionStatus` is `checking` until the first answer, `connected` once the GitHub answers, and `disconnected` after a failed sync (a cancel keeps `connected`); `repositoryWebUrl` builds the GitHub address
2. `src/views/DashboardView.vue` — holds `isSettingsOpen`; the header button and the "Configurar conexão" button call `openSettings`; the panel emits `close`
3. `src/components/AppHeader.vue` — brand link, page links, connection text, language buttons, theme icon button, and the Settings button
4. `src/components/SettingsPanel.vue` — a native `<dialog>` opened with `showModal()`: it traps the focus, closes with Escape, the "Fechar" button, or a click on the backdrop, and returns the focus to the element that opened it; it lists organization, repository, Project, token state (never the value), and the Project failure reason
5. `src/components/ConnectionSummary.vue` — the compact line above the filters, shown once a connection is known
6. `src/components/AppFooter.vue` — text and repository link

**Branch:** opening or closing the panel never reads from or changes the data. With `disconnected`, the results area shows the error and a "Configurar conexão" button that opens the panel. The connection values come from `.env`, so the panel has no connect, switch, or disconnect action.

---

## Idioma

Shows the interface in `pt-BR`, `en`, or `es`. The PT, EN and ES buttons in the header switch at once, with no reload and no request. The choice is saved in `localStorage` (`qa-dashboard-locale`), apart from the theme. With no saved choice, the browser language decides, and `pt-BR` is the fallback. Text from the GitHub (titles, assignees, labels, milestones, field names and values, names of Projects and repositories) is never translated.

**Flow:**

1. `src/main.ts` — `initializeLocale` runs before the first render
2. `src/composables/useLocale.ts` — `initializeLocale` reads the saved choice, then the browser languages; `changeLocale` switches, saves, and updates the `lang` attribute and the page title
3. `src/i18n/locales.ts` — `resolveInitialLocale`, `readSavedLocale`, and `saveLocale` (every storage call is in a try/catch)
4. `src/i18n/index.ts` and `src/i18n/messages/` — the `vue-i18n` instance and one catalog per language, with the same keys
5. `src/i18n/translate.ts` — `t`, `translateMessage`, `translateText`, `formatList`, and `formatNumber`; they read the active language, so a switch updates every screen
6. `src/rules/` and `src/services/appError.ts` — rules, errors, and statuses hold a message key and its data (`MessageRef`); the screen translates them, so the findings already shown change language with no new evaluation
7. `src/components/AppHeader.vue` — the language buttons (`LanguageSwitch.vue`); `DashboardView.vue` wires it to `useLocale`

**Branch:** a blocked `localStorage` or an invalid saved value falls back to the browser language, then to `pt-BR`; the switch still works for the session.

---

## Tema escuro

Switches the dashboard between light and dark colors. The first visit follows the system setting. The button choice is saved in `localStorage` and wins on later visits.

**Flow:**

1. `index.html` — an inline script sets `data-theme` on the page root before the first paint
2. `src/composables/useTheme.ts` — `useTheme` resolves the theme from the saved choice or the system setting, and `toggleTheme` flips and saves it
3. `src/components/ThemeToggle.vue` — the icon-only button (sun or moon) names the action for assistive technology and emits `toggle`
4. `src/components/AppHeader.vue` — places the button in the header; `DashboardView.vue` wires it to `useTheme`
5. `src/style.css` — color tokens on `:root` and `:root[data-theme=dark]`

**Branch:** when `localStorage` is blocked, the theme still works for the session. It is not saved.

---
