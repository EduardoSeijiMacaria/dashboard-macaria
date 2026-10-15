<script setup lang="ts">
import { computed } from 'vue'
import { t } from '../i18n/translate'
import type { Severity } from '../types/domain'

const props = defineProps<{ severity: Severity; label?: string }>()

const severityIcons: Record<Severity, string> = { error: '✖', warning: '▲', info: 'ℹ' }

const visibleLabel = computed(() => props.label ?? t(`severity.${props.severity}`))
</script>

<template>
  <span :class="['badge', severity]">
    <span aria-hidden="true">{{ severityIcons[severity] }}</span>
    <span>{{ visibleLabel }}</span>
  </span>
</template>
