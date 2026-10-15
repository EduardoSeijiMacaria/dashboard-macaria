<script setup lang="ts">
import { t } from '../i18n/translate'
import type { Filters } from '../types/domain'

defineProps<{ assignees: string[] }>()
const filters = defineModel<Filters>({ required: true })
</script>

<template>
  <form class="filters" role="search" :aria-label="t('filters.label')" @submit.prevent>
    <label>
      {{ t('filters.search') }}
      <input v-model="filters.query" type="search" :placeholder="t('filters.searchPlaceholder')" />
    </label>
    <label>
      {{ t('filters.assignee') }}
      <select v-model="filters.assignee">
        <option value="">{{ t('filters.all') }}</option>
        <option value="__none__">{{ t('filters.noAssignee') }}</option>
        <option v-for="assignee in assignees" :key="assignee" :value="assignee">
          {{ assignee }}
        </option>
      </select>
    </label>
    <label>
      {{ t('filters.type') }}
      <select v-model="filters.category">
        <option value="all">{{ t('filters.all') }}</option>
        <option value="task">Task</option>
        <option value="subtask">Subtask</option>
      </select>
    </label>
    <label>
      {{ t('filters.severity') }}
      <select v-model="filters.severity">
        <option value="all">{{ t('filters.allFeminine') }}</option>
        <option value="error">{{ t('filters.errors') }}</option>
        <option value="warning">{{ t('filters.warnings') }}</option>
      </select>
    </label>
    <label>
      {{ t('filters.situation') }}
      <select v-model="filters.view">
        <option value="all">{{ t('filters.allFeminine') }}</option>
        <option value="findings">{{ t('filters.withProblems') }}</option>
        <option value="insufficient">{{ t('filters.notEvaluated') }}</option>
      </select>
    </label>
    <fieldset>
      <legend>{{ t('filters.period') }}</legend>
      <select v-model="filters.dateField" :aria-label="t('filters.periodDate')">
        <option value="updatedAt">{{ t('filters.updatedAt') }}</option>
        <option value="createdAt">{{ t('filters.createdAt') }}</option>
        <option value="closedAt">{{ t('filters.closedAt') }}</option>
        <option value="start">Start</option>
        <option value="collectedAt">{{ t('filters.collectedAt') }}</option>
      </select>
      <input v-model="filters.from" type="date" :aria-label="t('filters.dateFrom')" />
      <input v-model="filters.to" type="date" :aria-label="t('filters.dateTo')" />
    </fieldset>
  </form>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 10px 12px;
  min-width: 0;
}

label,
fieldset {
  display: grid;
  gap: 3px;
  min-width: 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

label {
  width: 140px;
}

label:first-child {
  width: 200px;
}

fieldset {
  grid-template-columns: 130px 130px 130px;
  gap: 4px 6px;
  margin: 0;
  padding: 0;
  border: 0;
}

legend {
  margin-bottom: 3px;
  padding: 0;
}

@media (max-width: 720px) {
  label,
  label:first-child {
    width: calc(50% - 6px);
  }

  fieldset {
    grid-template-columns: 1fr 1fr;
    width: 100%;
  }

  fieldset select {
    grid-column: 1 / -1;
  }
}
</style>
