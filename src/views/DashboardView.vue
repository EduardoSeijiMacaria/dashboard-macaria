<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuditDashboard } from '../composables/useAuditDashboard'
import { useCurrentPage } from '../composables/useCurrentPage'
import { useLocale } from '../composables/useLocale'
import { useTheme } from '../composables/useTheme'
import { githubToken } from '../services/config'
import { t, translateMessage } from '../i18n/translate'
import { developerInfo } from '../services/developerInfo'
import AppFooter from '../components/AppFooter.vue'
import AppHeader from '../components/AppHeader.vue'
import ConnectionSummary from '../components/ConnectionSummary.vue'
import FilterBar from '../components/FilterBar.vue'
import IssueDetails from '../components/IssueDetails.vue'
import IssueTable from '../components/IssueTable.vue'
import RefreshControl from '../components/RefreshControl.vue'
import SettingsPanel from '../components/SettingsPanel.vue'
import StateMessage from '../components/StateMessage.vue'
import SummaryBar from '../components/SummaryBar.vue'
import AboutView from './AboutView.vue'

const {
  assignees,
  cancelSync,
  connectionStatus,
  filtered,
  filteredFindings,
  filters,
  incomplete,
  isUpdatingIssue,
  issues,
  issueUpdateStatus,
  lastCollected,
  loading,
  metrics,
  projectFailure,
  organizationName,
  projectLabel,
  repositoryName,
  repositoryWebUrl,
  selected,
  syncFailure,
  syncGithub,
  toggleIssueDetails,
  updateSelectedIssue
} = useAuditDashboard()
const isSettingsOpen = ref(false)
const { currentPage } = useCurrentPage()
const { theme, toggleTheme } = useTheme()
const { locale, changeLocale } = useLocale()

const isBusy = computed(() => loading.value || isUpdatingIssue.value)
const issuesWithProblemsCount = computed(() => metrics.value.errors + metrics.value.warnings)

function openSettings(): void {
  isSettingsOpen.value = true
}

function closeSettings(): void {
  isSettingsOpen.value = false
}
</script>

<template>
  <div class="page">
    <AppHeader
      :current-page="currentPage"
      :connection-status="connectionStatus"
      :theme="theme"
      :locale="locale"
      @toggle-theme="toggleTheme"
      @open-settings="openSettings"
      @change-locale="changeLocale"
    />

    <SettingsPanel
      :is-open="isSettingsOpen"
      :organization-name="organizationName"
      :repository-name="repositoryName"
      :project-label="projectLabel"
      :project-failure="projectFailure"
      :is-token-configured="Boolean(githubToken)"
      @close="closeSettings"
    />

    <main v-show="currentPage === 'dashboard'">
      <ConnectionSummary
        :organization-name="organizationName"
        :repository-name="repositoryName"
        :project-label="projectLabel"
      />

      <FilterBar v-model="filters" :assignees="assignees" />

      <div class="toolbar">
        <SummaryBar
          :analyzed-count="metrics.total"
          :issues-with-problems-count="issuesWithProblemsCount"
          :findings-count="metrics.findings"
        />
        <RefreshControl
          :last-collected="lastCollected"
          :is-loading="loading"
          :is-updating-issue="isUpdatingIssue"
          @refresh="syncGithub"
          @cancel="cancelSync"
        />
      </div>

      <section class="results" :aria-label="t('results.label')">
        <StateMessage v-if="loading" kind="loading">{{ t('results.loading') }}</StateMessage>
        <div v-else-if="syncFailure" class="connection-problem">
          <StateMessage kind="error">{{ translateMessage(syncFailure) }}</StateMessage>
          <button
            v-if="connectionStatus === 'disconnected'"
            type="button"
            class="primary"
            @click="openSettings"
          >
            {{ t('settings.configure') }}
          </button>
        </div>
        <StateMessage v-else-if="!issues.length" kind="empty">{{
          t('results.noIssues')
        }}</StateMessage>
        <StateMessage v-else-if="!filtered.length" kind="empty">{{
          t('results.noMatch')
        }}</StateMessage>
        <IssueTable
          v-else
          :issues="filtered"
          :findings="filteredFindings"
          :incomplete="incomplete"
          :selected-issue-id="selected?.id"
          @select="toggleIssueDetails"
        >
          <template #details="{ issue, issueFindings, issueNonEvaluated }">
            <IssueDetails
              :issue="issue"
              :findings="issueFindings"
              :incomplete="issueNonEvaluated"
              :is-busy="isBusy"
              :is-updating="isUpdatingIssue"
              :status-message="issueUpdateStatus"
              @update="updateSelectedIssue"
            />
          </template>
        </IssueTable>
      </section>
    </main>

    <AboutView v-if="currentPage === 'about'" :developer="developerInfo" />

    <AppFooter :repository-url="repositoryWebUrl" />
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  display: grid;
  flex: 1;
  align-content: start;
  gap: 14px;
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  padding: 16px 20px 24px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
}

.connection-problem {
  display: grid;
  justify-items: center;
  gap: 4px;
  padding-bottom: 32px;
}

.results {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}
</style>
