<script setup lang="ts">
import { computed } from 'vue'
import type { Theme } from '../composables/useTheme'
import { t } from '../i18n/translate'

const props = defineProps<{ theme: Theme }>()
defineEmits<{ toggle: [] }>()

const toggleLabel = computed(() =>
  props.theme === 'dark' ? t('theme.useLight') : t('theme.useDark')
)
</script>

<template>
  <button type="button" @click="$emit('toggle')">{{ toggleLabel }}</button>
</template>
