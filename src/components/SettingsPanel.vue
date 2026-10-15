<script setup lang="ts">
import { ref, watch } from 'vue'
import { t, translateMessage, translateText } from '../i18n/translate'
import type { Localizable, MessageRef } from '../types/domain'

const props = defineProps<{
  isOpen: boolean
  organizationName: string
  repositoryName: string
  projectLabel: Localizable
  projectFailure?: MessageRef
  isTokenConfigured: boolean
}>()
const emit = defineEmits<{ close: [] }>()

const dialog = ref<HTMLDialogElement>()

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && !dialog.value?.open) dialog.value?.showModal()
    if (!isOpen && dialog.value?.open) dialog.value.close()
  },
  { flush: 'post' }
)

function closeOnBackdropClick(event: MouseEvent): void {
  if (event.target === dialog.value) emit('close')
}
</script>

<template>
  <dialog
    ref="dialog"
    class="settings-panel"
    aria-labelledby="settings-title"
    @close="emit('close')"
    @click="closeOnBackdropClick"
  >
    <div class="content">
      <div class="top">
        <h2 id="settings-title">{{ t('settings.title') }}</h2>
        <button type="button" :aria-label="t('settings.closeLabel')" @click="emit('close')">
          <span aria-hidden="true">✕</span> {{ t('settings.closeText') }}
        </button>
      </div>

      <section aria-labelledby="settings-connection">
        <h3 id="settings-connection">{{ t('settings.sectionTitle') }}</h3>
        <dl>
          <dt>{{ t('labels.organization') }}</dt>
          <dd>{{ organizationName || t('settings.organizationUnknown') }}</dd>
          <dt>{{ t('labels.repository') }}</dt>
          <dd>{{ repositoryName || t('settings.repositoryUnknown') }}</dd>
          <dt>{{ t('labels.project') }}</dt>
          <dd>{{ projectLabel ? translateText(projectLabel) : t('settings.projectUnknown') }}</dd>
          <dt>{{ t('settings.token') }}</dt>
          <dd>
            {{ isTokenConfigured ? t('settings.tokenConfigured') : t('settings.tokenMissing') }}
          </dd>
        </dl>
        <p v-if="projectFailure" class="failure" role="alert">
          {{ t('settings.projectFailure', { reason: translateMessage(projectFailure) }) }}
        </p>
        <p class="hint">{{ t('settings.hint') }}</p>
      </section>
    </div>
  </dialog>
</template>

<style scoped>
.settings-panel {
  position: fixed;
  inset: 0 0 0 auto;
  width: min(380px, 100vw);
  height: 100%;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  border-left: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--text);
}

.settings-panel::backdrop {
  background: rgb(0 0 0 / 0.4);
}

.content {
  display: grid;
  align-content: start;
  gap: 20px;
  padding: 16px 20px 24px;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

h2 {
  font-size: 18px;
  font-weight: 650;
}

h3 {
  margin-bottom: 8px;
  font-size: 15px;
  font-weight: 650;
}

section {
  display: grid;
  gap: 10px;
}

dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 16px;
  margin: 0;
}

dt,
.hint {
  color: var(--muted);
}

dd {
  margin: 0;
  overflow-wrap: anywhere;
  font-weight: 600;
}

.hint {
  font-size: 13px;
}

.failure {
  color: var(--error-text);
  overflow-wrap: anywhere;
}
</style>
