<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppIcon, { type IconName } from '../components/AppIcon.vue'
import SeverityBadge from '../components/SeverityBadge.vue'
import type { MessageKey } from '../i18n/messageKeys'
import { formatList, t } from '../i18n/translate'
import { findUsableContact } from '../services/developerInfo'
import type { DeveloperInfo } from '../types/domain'

const props = defineProps<{ developer: DeveloperInfo }>()

interface Feature {
  icon: IconName
  titleKey: MessageKey
  textKey: MessageKey
}

const features: Feature[] = [
  { icon: 'database', titleKey: 'about.features.queryTitle', textKey: 'about.features.queryText' },
  { icon: 'alert', titleKey: 'about.features.findTitle', textKey: 'about.features.findText' },
  { icon: 'filter', titleKey: 'about.features.filterTitle', textKey: 'about.features.filterText' },
  { icon: 'list', titleKey: 'about.features.fixTitle', textKey: 'about.features.fixText' }
]

const heading = ref<HTMLHeadingElement>()
const contact = computed(() => findUsableContact(props.developer))

const filterControls = computed(() =>
  formatList(
    [
      t('filters.search'),
      t('filters.assignee'),
      t('filters.type'),
      t('filters.severity'),
      t('filters.situation'),
      t('filters.period')
    ],
    'comma'
  )
)

const periodDates = computed(() =>
  formatList(
    [
      t('filters.updatedAt'),
      t('filters.createdAt'),
      t('filters.closedAt'),
      'Start',
      t('filters.collectedAt')
    ],
    'comma'
  )
)

onMounted(() => heading.value?.focus())
</script>

<template>
  <main class="about">
    <a class="back" href="#/">{{ t('nav.back') }}</a>

    <section class="hero" aria-labelledby="about-title">
      <h2 id="about-title" ref="heading" tabindex="-1">Macaria QA</h2>
      <p class="lead">{{ t('about.lead') }}</p>
      <p class="intro">{{ t('about.intro') }}</p>
    </section>

    <section aria-labelledby="about-features">
      <h3 id="about-features">{{ t('about.featuresTitle') }}</h3>
      <ul class="features">
        <li v-for="feature in features" :key="feature.titleKey">
          <span class="icon"><AppIcon :name="feature.icon" /></span>
          <h4>{{ t(feature.titleKey) }}</h4>
          <p>{{ t(feature.textKey) }}</p>
        </li>
      </ul>
    </section>

    <section aria-labelledby="about-usage">
      <h3 id="about-usage">{{ t('about.usageTitle') }}</h3>
      <ol class="steps">
        <li>
          <h4>{{ t('about.steps.connectionTitle') }}</h4>
          <p>{{ t('about.steps.connectionText', { settings: t('settings.open') }) }}</p>
        </li>
        <li>
          <h4>{{ t('about.steps.loadTitle') }}</h4>
          <p>{{ t('about.steps.loadText', { refresh: t('refresh.button') }) }}</p>
        </li>
        <li>
          <h4>{{ t('about.steps.filterTitle') }}</h4>
          <p>
            {{
              t('about.steps.filterText', {
                controls: filterControls,
                period: t('filters.period'),
                dates: periodDates
              })
            }}
          </p>
        </li>
        <li>
          <h4>{{ t('about.steps.analyzeTitle') }}</h4>
          <p>{{ t('about.steps.analyzeText') }}</p>
        </li>
        <li>
          <h4>{{ t('about.steps.correctTitle') }}</h4>
          <p>{{ t('about.steps.correctText', { open: t('details.open') }) }}</p>
        </li>
        <li>
          <h4>{{ t('about.steps.checkTitle') }}</h4>
          <p>
            {{
              t('about.steps.checkText', {
                updateIssue: t('details.update'),
                refresh: t('refresh.button')
              })
            }}
          </p>
        </li>
      </ol>
    </section>

    <section aria-labelledby="about-results">
      <h3 id="about-results">{{ t('about.resultsTitle') }}</h3>
      <p class="section-note">{{ t('about.resultsIntro') }}</p>
      <ul class="states">
        <li>
          <SeverityBadge severity="error" :label="t('table.errorCount', { count: 1 }, 1)" />
          <p>
            {{ t('about.stateError') }} {{ t('about.example') }} <strong>Tag</strong> —
            {{ t('rules.tag') }}
          </p>
        </li>
        <li>
          <SeverityBadge severity="warning" :label="t('table.warningCount', { count: 1 }, 1)" />
          <p>
            {{ t('about.stateWarning') }} {{ t('about.example') }}
            <strong>{{ t('fields.title') }}</strong> — {{ t('rules.taskTitleFormat') }}
          </p>
        </li>
        <li>
          <SeverityBadge severity="info" :label="t('table.notEvaluated')" />
          <p>{{ t('about.stateNotEvaluated') }}</p>
        </li>
        <li>
          <span class="badge ok">
            <span aria-hidden="true">✔</span> {{ t('table.noProblems') }}
          </span>
          <p>{{ t('about.stateOk') }}</p>
        </li>
      </ul>
      <p class="section-note">{{ t('about.resultsNote') }}</p>
    </section>

    <section class="panel" aria-labelledby="about-privacy">
      <h3 id="about-privacy"><AppIcon name="shield" /> {{ t('about.privacyTitle') }}</h3>
      <ul class="essentials">
        <li>{{ t('about.privacy.readOnly') }}</li>
        <li>{{ t('about.privacy.direct') }}</li>
        <li>{{ t('about.privacy.access', { notEvaluated: t('table.notEvaluated') }) }}</li>
        <li>{{ t('about.privacy.storage') }}</li>
        <li>{{ t('about.privacy.lastUpdate') }}</li>
      </ul>
    </section>

    <section class="developer" aria-labelledby="about-contact">
      <h3 id="about-contact"><AppIcon name="user" /> {{ t('about.developerTitle') }}</h3>
      <p class="developer-name">{{ t('about.developedBy', { name: developer.name }) }}</p>
      <p>{{ t('about.purpose') }}</p>
      <p v-if="contact" class="contact">
        {{ t('about.contactBy', { channel: contact.name }) }}
        <a class="contact-link" :href="contact.url" target="_blank" rel="noopener noreferrer">
          {{ contact.display ?? contact.name }}
        </a>
      </p>
      <p v-else class="muted">{{ t('about.contactMissing') }}</p>
      <p class="muted small">{{ t('about.repositoryNote') }}</p>
    </section>
  </main>
</template>

<style scoped>
.about {
  display: grid;
  gap: 28px;
  width: 100%;
  max-width: 920px;
  margin: 0 auto;
  padding: 16px 20px 40px;
}

.back {
  justify-self: start;
}

h2 {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.15;
}

h2:focus {
  outline: none;
}

h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 18px;
  font-weight: 650;
}

h4 {
  font-size: 15px;
  font-weight: 650;
}

section {
  min-width: 0;
}

p,
li {
  max-width: 68ch;
}

.hero {
  display: grid;
  gap: 8px;
  padding: 22px 24px;
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent);
  border-radius: 8px;
  background: var(--surface);
}

.lead {
  color: var(--accent);
  font-size: 17px;
  font-weight: 600;
}

.intro {
  color: var(--muted);
  font-size: 15px;
}

.section-note {
  margin: 0 0 12px;
  color: var(--muted);
  font-size: 13px;
}

.section-note:last-child {
  margin: 12px 0 0;
}

ul,
ol {
  margin: 0;
  padding: 0;
  list-style: none;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
}

.features li,
.states li,
.panel,
.developer {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}

.features li {
  display: grid;
  align-content: start;
  gap: 4px;
  padding: 14px;
}

.features p {
  color: var(--muted);
  font-size: 13px;
}

.icon {
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 30px;
  margin-bottom: 4px;
  border-radius: 6px;
  background: var(--info-bg);
  color: var(--accent);
}

.steps {
  display: grid;
  gap: 14px;
  counter-reset: step;
}

.steps li {
  display: grid;
  gap: 2px;
  padding-left: 44px;
  position: relative;
  counter-increment: step;
}

.steps li::before {
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
  content: counter(step);
  font-size: 14px;
  font-weight: 700;
}

.steps p {
  color: var(--muted);
}

.states {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.states li {
  display: grid;
  justify-items: start;
  align-content: start;
  gap: 8px;
  padding: 14px;
}

.panel {
  display: grid;
  gap: 12px;
  padding: 18px 20px;
}

.panel h3 {
  margin: 0;
}

.essentials {
  display: grid;
  gap: 8px;
}

.essentials li {
  padding-left: 18px;
  position: relative;
}

.essentials li::before {
  position: absolute;
  left: 2px;
  color: var(--accent);
  content: '•';
  font-weight: 700;
}

.developer {
  display: grid;
  gap: 6px;
  padding: 18px 20px;
}

.developer h3 {
  margin-bottom: 4px;
}

.developer-name {
  font-size: 16px;
}

.contact {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
}

.contact-link {
  display: inline-block;
  padding: 8px 14px;
  border: 1px solid var(--accent);
  border-radius: 6px;
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
}

.contact-link:hover {
  background: var(--accent);
  color: var(--on-accent);
}

.muted {
  color: var(--muted);
}

.small {
  font-size: 13px;
}

@media (max-width: 720px) {
  .about {
    gap: 24px;
    padding: 16px;
  }

  h2 {
    font-size: 24px;
  }

  .states {
    grid-template-columns: 1fr;
  }

  .hero {
    padding: 18px 16px;
  }
}
</style>
