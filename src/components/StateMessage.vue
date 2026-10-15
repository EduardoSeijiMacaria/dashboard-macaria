<script setup lang="ts">
defineProps<{ kind: 'loading' | 'error' | 'empty' }>()
</script>

<template>
  <div :class="['message', kind]" :role="kind === 'error' ? 'alert' : 'status'">
    <span v-if="kind === 'loading'" class="spinner" aria-hidden="true"></span>
    <span v-if="kind === 'error'" aria-hidden="true">✖</span>
    <p><slot /></p>
  </div>
</template>

<style scoped>
.message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 16px;
  color: var(--muted);
  text-align: center;
}

.error {
  color: var(--error-text);
}
</style>
