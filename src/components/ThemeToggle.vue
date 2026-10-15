<script setup lang="ts">
import { computed } from 'vue'
import type { Theme } from '../composables/useTheme'
import { t } from '../i18n/translate'
import AppIcon from './AppIcon.vue'

const props = defineProps<{ theme: Theme }>()
defineEmits<{ toggle: [] }>()

const toggleLabel = computed(() =>
  props.theme === 'dark' ? t('theme.useLight') : t('theme.useDark')
)
const iconName = computed(() => (props.theme === 'dark' ? 'sun' : 'moon'))
</script>

<template>
  <button
    type="button"
    :class="iconName"
    :aria-label="toggleLabel"
    :title="toggleLabel"
    @click="$emit('toggle')"
  >
    <Transition name="icon-swap">
      <AppIcon :key="iconName" :name="iconName" />
    </Transition>
  </button>
</template>

<style scoped>
button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

button :deep(svg) {
  display: block;
}

button.sun {
  color: #f5c518;
}

button {
  transition:
    background-color 0.2s ease,
    color 0.3s ease;
}

.icon-swap-enter-active,
.icon-swap-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.icon-swap-leave-active {
  position: absolute;
}

.icon-swap-enter-from {
  transform: rotate(-90deg) scale(0.5);
  opacity: 0;
}

.icon-swap-leave-to {
  transform: rotate(90deg) scale(0.5);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .icon-swap-enter-active,
  .icon-swap-leave-active {
    transition: none;
  }
}
</style>
