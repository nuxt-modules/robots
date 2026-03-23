<script setup lang="ts">
import { useAsyncData, useHead } from '#imports'
import { useLocalStorage } from '@vueuse/core'
import { computed, watch } from 'vue'
import { appFetch, colorMode } from './composables/rpc'
import { loadShiki } from './composables/shiki'
import { envTab, hasProductionUrl, isProductionMode, path, previewSource, productionUrl, refreshSources } from './util/logic'

await loadShiki()

interface GlobalDebugData {
  indexable: boolean
  hints: string[]
  runtimeConfig: { version: string }
  robotsTxt: string
  siteConfig?: { url?: string }
  validation: { errors: string[], warnings: string[], groups: number, sitemaps: string[] }
}

const globalDebugFetch = useAsyncData<GlobalDebugData>(() => {
  if (!appFetch.value || typeof appFetch.value !== 'function')
    return null
  const query: Record<string, any> = {}
  if (envTab.value === 'Production')
    query.mockProductionEnv = true
  return appFetch.value('/__robots__/debug.json', { query })
}, {
  watch: [envTab, appFetch],
})
const { data: globalDebug } = globalDebugFetch

const pathDebug = useAsyncData<any>(() => {
  if (!appFetch.value || typeof appFetch.value !== 'function')
    return null
  const req: Record<string, any> = { path: path.value }
  if (envTab.value === 'Production')
    req.mockProductionEnv = true
  return appFetch.value('/__robots__/debug-path.json', { query: req })
}, {
  watch: [envTab, path, appFetch],
})

const pathDebugData = computed(() => pathDebug.data?.value)
const globalDebugData = computed(() => globalDebug.value || {} as GlobalDebugData)
const version = computed(() => globalDebugData.value?.runtimeConfig?.version || '')

const metaTag = computed(() => {
  const content = pathDebugData.value?.rule || ''
  return `<meta name="robots" content="${content}">`
})

// Sync production URL from debug data
watch(globalDebug, (val) => {
  if (val?.siteConfig?.url)
    productionUrl.value = val.siteConfig.url
}, { immediate: true })

const productionHostname = computed(() => {
  try {
    return new URL(productionUrl.value).hostname
  }
  catch {
    return productionUrl.value
  }
})

const isDark = computed(() => colorMode.value === 'dark')
useHead({
  title: 'Nuxt Robots',
  htmlAttrs: {
    class: () => isDark.value ? 'dark' : '',
  },
})

const tab = useLocalStorage('nuxt-robots:tab', 'overview')

const allNavItems = [
  { value: 'overview', icon: 'carbon:dashboard-reference', label: 'Overview', devOnly: false },
  { value: 'debug', icon: 'carbon:debug', label: 'Debug', devOnly: true },
  { value: 'docs', icon: 'carbon:book', label: 'Docs', devOnly: false },
]

const navItems = computed(() =>
  isProductionMode.value
    ? allNavItems.filter(item => !item.devOnly)
    : allNavItems,
)

// Redirect to overview when switching to production mode from a dev-only tab
watch(isProductionMode, (isProd) => {
  if (isProd && tab.value === 'debug')
    tab.value = 'overview'
})
</script>

<template>
  <UApp>
    <div class="relative bg-base flex flex-col min-h-screen">
      <div class="gradient-bg" />

      <!-- Header -->
      <header class="header glass sticky top-0 z-50">
        <div class="header-content">
          <div class="flex items-center gap-3 sm:gap-4">
            <a
              href="https://nuxtseo.com"
              target="_blank"
              class="flex items-center opacity-90 hover:opacity-100 transition-opacity"
            >
              <NuxtSeoLogo class="h-6 sm:h-7" />
            </a>

            <div class="divider" />

            <div class="flex items-center gap-2">
              <div class="brand-icon">
                <UIcon name="carbon:bot" class="text-base sm:text-lg" />
              </div>
              <h1 class="text-sm sm:text-base font-semibold tracking-tight text-[var(--color-text)]">
                Robots
              </h1>
              <UBadge
                color="neutral"
                variant="subtle"
                size="xs"
                class="font-mono text-[10px] sm:text-xs hidden sm:inline-flex"
              >
                {{ version }}
              </UBadge>
            </div>
          </div>

          <nav class="flex items-center gap-1 sm:gap-2">
            <div class="nav-tabs">
              <button
                v-for="item of navItems"
                :key="item.value"
                type="button"
                class="nav-tab"
                :class="[
                  tab === item.value ? 'active' : '',
                  globalDebugFetch.status.value === 'pending' ? 'opacity-50 pointer-events-none' : '',
                ]"
                @click="tab = item.value"
              >
                <UTooltip :text="item.label" :delay-duration="300">
                  <div class="nav-tab-inner">
                    <UIcon
                      :name="item.icon"
                      class="text-base sm:text-lg"
                      :class="tab === item.value ? 'text-[var(--seo-green)]' : ''"
                    />
                    <span class="nav-label">{{ item.label }}</span>
                  </div>
                </UTooltip>
              </button>
            </div>

            <!-- Preview source toggle -->
            <div v-if="hasProductionUrl" class="preview-source-toggle">
              <button
                class="preview-source-btn"
                :class="{ active: previewSource === 'local' }"
                @click="previewSource = 'local'"
              >
                <UIcon name="carbon:laptop" class="w-3.5 h-3.5" />
                <span class="hidden sm:inline">Local</span>
              </button>
              <button
                class="preview-source-btn"
                :class="{ active: previewSource === 'production' }"
                @click="previewSource = 'production'"
              >
                <UIcon name="carbon:cloud" class="w-3.5 h-3.5" />
                <span class="hidden sm:inline">Production</span>
              </button>
            </div>

            <!-- Production URL indicator -->
            <UTooltip v-if="isProductionMode" :text="productionUrl" :delay-duration="200">
              <span class="production-url-badge">
                <span class="production-url-dot" />
                <span class="hidden sm:inline text-xs">{{ productionHostname }}</span>
              </span>
            </UTooltip>

            <div class="flex items-center gap-1">
              <UTooltip text="Refresh" :delay-duration="300">
                <UButton
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  icon="carbon:reset"
                  class="nav-action"
                  @click="refreshSources"
                />
              </UTooltip>
              <UTooltip text="GitHub" :delay-duration="300">
                <UButton
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  icon="simple-icons:github"
                  to="https://github.com/nuxt-modules/robots"
                  target="_blank"
                  class="nav-action hidden sm:flex"
                />
              </UTooltip>
            </div>
          </nav>
        </div>
      </header>

      <!-- Main Content -->
      <div class="main-content">
        <main class="mx-auto flex flex-col w-full max-w-7xl">
          <!-- Loading -->
          <div
            v-if="!globalDebug || globalDebugFetch.status.value === 'pending'"
            class="flex items-center justify-center py-20"
          >
            <UIcon name="carbon:circle-dash" class="animate-spin text-3xl text-[var(--color-text-muted)]" />
          </div>

          <!-- Error -->
          <div
            v-else-if="globalDebugFetch.error.value"
            class="flex flex-col items-center justify-center gap-3 py-16 text-center"
          >
            <UIcon name="carbon:warning" class="text-3xl text-red-500" />
            <p class="text-sm font-medium">
              Error loading debug data
            </p>
            <p class="text-xs text-[var(--color-text-muted)] max-w-xs">
              {{ globalDebugFetch.error.value }}
            </p>
          </div>

          <template v-else>
            <!-- Overview Tab -->
            <div
              v-if="tab === 'overview'"
              class="stagger-children space-y-4"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-semibold mb-0.5">
                    Overview
                  </h2>
                  <p class="text-xs text-[var(--color-text-muted)]">
                    Page and site indexability status.
                  </p>
                </div>
                <div v-if="!isProductionMode" class="nav-tabs">
                  <button
                    v-for="env of ['Production', 'Development']"
                    :key="env"
                    type="button"
                    class="nav-tab"
                    :class="env === envTab ? 'active' : ''"
                    @click="envTab = env"
                  >
                    <div class="nav-tab-inner">
                      <span class="text-xs sm:text-sm">{{ env }}</span>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Page Indexable -->
              <OSectionBlock icon="carbon:document" text="Page Indexable">
                <div v-if="!pathDebugData" class="flex items-center justify-center py-6">
                  <UIcon name="carbon:circle-dash" class="animate-spin text-xl text-[var(--color-text-muted)]" />
                </div>
                <div v-else class="space-y-3">
                  <div class="flex items-center gap-3">
                    <div v-if="pathDebugData?.indexable && pathDebugData.crawlable" class="status-enabled">
                      <UIcon name="carbon:checkmark" class="text-sm" />
                      <span>Indexable</span>
                    </div>
                    <div v-else class="status-disabled">
                      <UIcon name="carbon:warning" class="text-sm" />
                      <span>Not Indexable</span>
                    </div>
                    <span class="text-sm text-[var(--color-text-muted)]">
                      <template v-if="!pathDebugData.crawlable">
                        Robots cannot access <code class="inline-code">{{ path }}</code>.
                      </template>
                      <template v-else-if="!pathDebugData.indexable">
                        Robots can access but not index <code class="inline-code">{{ path }}</code>.
                      </template>
                      <template v-else>
                        Robots can access and crawl <code class="inline-code">{{ path }}</code>.
                      </template>
                    </span>
                  </div>
                  <OCodeBlock :code="metaTag" lang="html" />
                  <OCodeBlock
                    v-if="pathDebugData.robotsHeader"
                    :code="`X-Robots-Tag: ${pathDebugData.robotsHeader}`"
                    lang="bash"
                  />
                  <div v-if="pathDebugData?.debug && !isProductionMode" class="flex gap-2 flex-wrap">
                    <UBadge
                      v-if="pathDebugData.debug.source"
                      color="neutral"
                      variant="subtle"
                      size="xs"
                    >
                      Source: {{ pathDebugData.debug.source }}
                    </UBadge>
                    <UBadge
                      v-if="pathDebugData.debug.line"
                      color="neutral"
                      variant="subtle"
                      size="xs"
                    >
                      {{ pathDebugData.debug.line }}
                    </UBadge>
                  </div>
                </div>
              </OSectionBlock>

              <!-- Site Indexable -->
              <OSectionBlock icon="carbon:earth" text="Site Indexable">
                <div class="space-y-3">
                  <div class="flex items-center gap-3">
                    <div v-if="globalDebugData?.indexable" class="status-enabled">
                      <UIcon name="carbon:checkmark" class="text-sm" />
                      <span>Crawlable</span>
                    </div>
                    <div v-else class="status-disabled">
                      <UIcon name="carbon:warning" class="text-sm" />
                      <span>Blocked</span>
                    </div>
                    <span class="text-sm text-[var(--color-text-muted)]">
                      {{ globalDebugData?.indexable ? 'Robots can crawl your site.' : 'Robots are blocked from crawling your site.' }}
                    </span>
                  </div>
                  <div v-if="globalDebugData?.hints?.length && !isProductionMode" class="hint-callout">
                    <UIcon name="carbon:information" class="hint-callout-icon text-lg flex-shrink-0 mt-0.5" />
                    <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
                      <li v-for="(hint, key) in globalDebugData.hints" :key="key">
                        {{ hint.replace(' with ?mockProductionEnv query.', '.') }}
                      </li>
                    </ul>
                  </div>
                </div>
              </OSectionBlock>

              <!-- robots.txt -->
              <OSectionBlock icon="carbon:document-blank" text="/robots.txt">
                <template #actions>
                  <div v-if="globalDebugData?.validation?.errors?.length" class="status-disabled">
                    <UIcon name="carbon:warning" class="text-sm" />
                    <span>{{ globalDebugData.validation.errors.length }} error{{ globalDebugData.validation.errors.length === 1 ? '' : 's' }}</span>
                  </div>
                  <div v-if="globalDebugData?.validation?.warnings?.length" class="status-warning">
                    <UIcon name="carbon:warning-alt" class="text-sm" />
                    <span>{{ globalDebugData.validation.warnings.length }} warning{{ globalDebugData.validation.warnings.length === 1 ? '' : 's' }}</span>
                  </div>
                  <div v-else-if="globalDebugData?.validation && !globalDebugData?.validation?.errors?.length" class="status-enabled">
                    <UIcon name="carbon:checkmark" class="text-sm" />
                    <span>Valid</span>
                  </div>
                </template>
                <OCodeBlock :code="globalDebugData.robotsTxt" lang="robots-txt" />

                <!-- Validation errors -->
                <div v-if="globalDebugData?.validation?.errors?.length" class="validation-callout validation-callout--error">
                  <div class="flex items-center gap-2 mb-2">
                    <UIcon name="carbon:warning" class="text-sm" />
                    <span class="text-xs font-semibold">Validation Issues</span>
                  </div>
                  <ul class="space-y-1">
                    <li
                      v-for="(err, i) in globalDebugData.validation.errors"
                      :key="i"
                      class="text-xs font-mono text-[var(--color-text-muted)]"
                    >
                      {{ err }}
                    </li>
                  </ul>
                </div>

                <!-- Validation warnings -->
                <div v-if="globalDebugData?.validation?.warnings?.length" class="validation-callout validation-callout--warning">
                  <div class="flex items-center gap-2 mb-2">
                    <UIcon name="carbon:warning-alt" class="text-sm" />
                    <span class="text-xs font-semibold">Warnings</span>
                  </div>
                  <ul class="space-y-1">
                    <li
                      v-for="(warn, i) in globalDebugData.validation.warnings"
                      :key="i"
                      class="text-xs font-mono text-[var(--color-text-muted)]"
                    >
                      {{ warn }}
                    </li>
                  </ul>
                </div>

                <!-- Sitemaps -->
                <div v-if="globalDebugData?.validation?.sitemaps?.length" class="validation-callout validation-callout--info">
                  <div class="flex items-center gap-2 mb-2">
                    <UIcon name="carbon:map" class="text-sm" />
                    <span class="text-xs font-semibold">Sitemaps</span>
                  </div>
                  <ul class="space-y-1">
                    <li
                      v-for="sitemap in globalDebugData.validation.sitemaps"
                      :key="sitemap"
                      class="text-xs font-mono text-[var(--color-text-muted)] truncate"
                    >
                      {{ sitemap }}
                    </li>
                  </ul>
                </div>
              </OSectionBlock>
            </div>

            <!-- Debug Tab -->
            <div
              v-else-if="tab === 'debug'"
              class="stagger-children space-y-4"
            >
              <OSectionBlock icon="carbon:settings" text="Runtime Config">
                <OCodeBlock
                  :code="JSON.stringify(globalDebugData?.runtimeConfig || {}, null, 2)"
                  lang="json"
                />
              </OSectionBlock>
            </div>

            <!-- Docs Tab -->
            <div
              v-else-if="tab === 'docs'"
              class="h-full animate-fade-up"
            >
              <iframe
                src="https://nuxtseo.com/robots"
                class="w-full h-full border-none rounded-lg"
                style="min-height: calc(100vh - 100px);"
              />
            </div>
          </template>
        </main>
      </div>
    </div>
  </UApp>
</template>

<style>
/* Header */
.header {
  border-bottom: 1px solid var(--color-border);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.625rem 1rem;
  max-width: 80rem;
  margin: 0 auto;
  width: 100%;
}

@media (min-width: 640px) {
  .header-content {
    padding: 0.75rem 1.25rem;
  }
}

.divider {
  width: 1px;
  height: 1.25rem;
  background: var(--color-border);
}

.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-sm);
  background: oklch(65% 0.2 145 / 0.12);
  color: var(--seo-green);
}

/* Navigation tabs */
.nav-tabs {
  display: flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.25rem;
  border-radius: var(--radius-md);
  background: var(--color-surface-sunken);
  border: 1px solid var(--color-border-subtle);
}

.nav-tab {
  position: relative;
  border-radius: var(--radius-sm);
  transition: background 150ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 150ms cubic-bezier(0.22, 1, 0.36, 1);
}

.nav-tab-inner {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  font-weight: 500;
}

@media (min-width: 640px) {
  .nav-tab-inner {
    padding: 0.375rem 0.75rem;
  }
}

.nav-tab:hover .nav-tab-inner {
  color: var(--color-text);
}

.nav-tab.active {
  background: var(--color-surface-elevated);
  box-shadow: 0 1px 3px oklch(0% 0 0 / 0.08);
}

.dark .nav-tab.active {
  box-shadow: 0 1px 3px oklch(0% 0 0 / 0.3);
}

.nav-tab.active .nav-tab-inner {
  color: var(--color-text);
}

.nav-label {
  display: none;
}

@media (min-width: 640px) {
  .nav-label {
    display: inline;
  }
}

.nav-action {
  color: var(--color-text-muted) !important;
}

.nav-action:hover {
  color: var(--color-text) !important;
  background: var(--color-surface-sunken) !important;
}

/* Preview source toggle */
.preview-source-toggle {
  display: flex;
  gap: 1px;
  background: var(--color-border);
  border-radius: 6px;
  overflow: hidden;
}

.preview-source-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: var(--color-surface-sunken);
  border: none;
  cursor: pointer;
  transition: color 150ms, background 150ms;
  white-space: nowrap;
}

.preview-source-btn:hover {
  color: var(--color-text);
  background: var(--color-surface-elevated);
}

.preview-source-btn.active {
  color: var(--color-text);
  background: var(--color-surface-elevated);
  box-shadow: 0 1px 2px oklch(0% 0 0 / 0.06);
}

.dark .preview-source-btn.active {
  box-shadow: 0 1px 2px oklch(0% 0 0 / 0.2);
}

/* Production URL badge */
.production-url-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full);
  background: oklch(85% 0.12 145 / 0.12);
  color: oklch(45% 0.15 145);
  font-weight: 500;
  font-family: var(--font-mono, ui-monospace, monospace);
}

.dark .production-url-badge {
  background: oklch(35% 0.08 145 / 0.2);
  color: oklch(75% 0.12 145);
}

.production-url-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: oklch(65% 0.2 145);
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Main content wrapper */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  min-height: calc(100vh - 60px);
}

@media (min-width: 640px) {
  .main-content {
    padding: 1rem;
  }
}

@media (max-height: 600px) {
  .main-content {
    padding: 0;
    min-height: 0;
  }
}

/* Inline code */
.inline-code {
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  background: var(--color-surface-sunken);
  font-size: 0.75rem;
  font-family: var(--font-mono);
}

/* Validation callouts */
.validation-callout {
  padding: 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid;
}

.validation-callout--error {
  background: oklch(65% 0.12 25 / 0.06);
  border-color: oklch(65% 0.12 25 / 0.15);
  color: oklch(55% 0.15 25);
}

.dark .validation-callout--error {
  background: oklch(45% 0.1 25 / 0.1);
  border-color: oklch(45% 0.1 25 / 0.2);
  color: oklch(70% 0.12 25);
}

.validation-callout--warning {
  background: oklch(75% 0.12 85 / 0.06);
  border-color: oklch(75% 0.12 85 / 0.15);
  color: oklch(55% 0.15 85);
}

.dark .validation-callout--warning {
  background: oklch(55% 0.1 85 / 0.1);
  border-color: oklch(55% 0.1 85 / 0.2);
  color: oklch(75% 0.12 85);
}

.validation-callout--info {
  background: oklch(65% 0.15 145 / 0.06);
  border-color: oklch(65% 0.15 145 / 0.15);
  color: var(--seo-green);
}

.dark .validation-callout--info {
  background: oklch(50% 0.12 145 / 0.1);
  border-color: oklch(50% 0.12 145 / 0.2);
}

/* Base HTML */
html {
  font-family: var(--font-sans);
  overflow-y: scroll;
  overscroll-behavior: none;
}

body {
  min-height: 100vh;
}

html.dark {
  color-scheme: dark;
}

/* Textarea */
textarea {
  background: var(--color-surface-sunken);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

textarea:focus-visible {
  border-color: var(--seo-green);
  outline: none;
}

/* JSON Editor theme */
:root {
  --jse-theme-color: var(--color-surface-elevated) !important;
  --jse-text-color-inverse: var(--color-text-muted) !important;
  --jse-theme-color-highlight: var(--color-surface-sunken) !important;
  --jse-panel-background: var(--color-surface-elevated) !important;
  --jse-background-color: var(--jse-panel-background) !important;
  --jse-error-color: oklch(65% 0.2 25 / 0.3) !important;
  --jse-main-border: none !important;
}

.dark,
.jse-theme-dark {
  --jse-panel-background: var(--color-neutral-900) !important;
  --jse-theme-color: var(--color-neutral-900) !important;
  --jse-text-color-inverse: var(--color-neutral-300) !important;
  --jse-main-border: none !important;
}

.jse-main {
  min-height: 1em !important;
}

.jse-contents {
  border-width: 0 !important;
  border-radius: var(--radius-md) !important;
}
</style>
