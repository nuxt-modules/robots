<script setup lang="ts">
import { useAsyncData, useHead } from '#imports'
import { useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'
import { appFetch, colorMode } from './composables/rpc'
import { loadShiki } from './composables/shiki'
import { envTab, path, refreshSources } from './util/logic'

await loadShiki()

const loading = ref(false)
const refreshing = ref(false)

async function refresh() {
  if (refreshing.value)
    return
  refreshing.value = true
  loading.value = true
  refreshSources()
  setTimeout(() => {
    loading.value = false
    refreshing.value = false
  }, 300)
}

const globalDebugFetch = useAsyncData<{ indexable: boolean, hints: string[], runtimeConfig: { version: string }, robotsTxt: string }>(() => {
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
const globalDebugData = computed(() => globalDebug.value || {})
const version = computed(() => globalDebugData.value?.runtimeConfig?.version || '')

const metaTag = computed(() => {
  const content = pathDebugData.value?.rule || ''
  return `<meta name="robots" content="${content}">`
})

const isDark = computed(() => colorMode.value === 'dark')
useHead({
  title: 'Nuxt Robots',
  htmlAttrs: {
    class: () => isDark.value ? 'dark' : '',
  },
})

const tab = useLocalStorage('nuxt-robots:tab', 'overview')

const navItems = [
  { value: 'overview', icon: 'carbon:dashboard-reference', label: 'Overview' },
  { value: 'debug', icon: 'carbon:debug', label: 'Debug' },
  { value: 'docs', icon: 'carbon:book', label: 'Docs' },
]
</script>

<template>
  <UApp>
    <div class="relative bg-base flex flex-col min-h-screen">
      <div class="gradient-bg" />

      <!-- Header -->
      <header class="header glass sticky top-0 z-50">
        <div class="header-content">
          <!-- Logo & Brand -->
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
                <UIcon
                  name="carbon:bot"
                  class="text-base sm:text-lg"
                />
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

          <!-- Navigation -->
          <nav class="flex items-center gap-1 sm:gap-2">
            <!-- Nav Tabs -->
            <div class="nav-tabs">
              <button
                v-for="item of navItems"
                :key="item.value"
                type="button"
                class="nav-tab"
                :class="[
                  tab === item.value ? 'active' : '',
                  loading ? 'opacity-50 pointer-events-none' : '',
                ]"
                @click="tab = item.value"
              >
                <UTooltip
                  :text="item.label"
                  :delay-duration="300"
                >
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

            <!-- Actions -->
            <div class="flex items-center gap-1">
              <UTooltip
                text="Refresh"
                :delay-duration="300"
              >
                <UButton
                  square
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  icon="carbon:reset"
                  class="nav-action"
                  :class="{ 'refresh-spinning': refreshing }"
                  :disabled="refreshing"
                  @click="refresh"
                />
              </UTooltip>

              <UTooltip
                text="GitHub"
                :delay-duration="300"
              >
                <UButton
                  square
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
      <div
        class="flex-1 flex flex-col p-3 sm:p-4"
        style="min-height: calc(100vh - 60px);"
      >
        <main class="mx-auto flex flex-col w-full max-w-7xl">
          <div
            v-if="!globalDebug || globalDebugFetch.status.value === 'pending' || loading"
            class="flex items-center justify-center py-20"
          >
            <UIcon
              name="carbon:circle-dash"
              class="animate-spin text-3xl text-[var(--color-text-muted)]"
            />
          </div>
          <template v-else-if="globalDebugFetch.error.value">
            <div class="empty-state card">
              <UIcon
                name="carbon:warning"
                class="empty-state-icon text-red-500"
              />
              <p class="text-sm font-medium mb-1">
                Error loading debug data
              </p>
              <p class="text-xs opacity-70 max-w-xs">
                {{ globalDebugFetch.error.value }}
              </p>
            </div>
          </template>
          <template v-else>
            <!-- Overview Tab -->
            <div
              v-if="tab === 'overview'"
              class="space-y-5 animate-fade-up"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-semibold mb-1">
                    Overview
                  </h2>
                  <p class="text-xs text-[var(--color-text-muted)]">
                    Page and site indexability status.
                  </p>
                </div>

                <!-- Environment Toggle -->
                <div class="nav-tabs">
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
              <OSectionBlock
                icon="carbon:document"
                text="Page Indexable"
              >
                <div v-if="!pathDebugData" class="flex items-center justify-center py-6">
                  <UIcon
                    name="carbon:circle-dash"
                    class="animate-spin text-xl text-[var(--color-text-muted)]"
                  />
                </div>
                <div v-else class="space-y-4">
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
                        Robots are not allowed to access <code class="px-1 py-0.5 rounded bg-[var(--color-surface-sunken)] text-xs">{{ path }}</code>.
                      </template>
                      <template v-else-if="!pathDebugData.indexable">
                        Robots can access but not index <code class="px-1 py-0.5 rounded bg-[var(--color-surface-sunken)] text-xs">{{ path }}</code>.
                      </template>
                      <template v-else>
                        Robots can access and crawl <code class="px-1 py-0.5 rounded bg-[var(--color-surface-sunken)] text-xs">{{ path }}</code>.
                      </template>
                    </span>
                  </div>
                  <OCodeBlock :code="metaTag" lang="html" />
                  <OCodeBlock
                    v-if="pathDebugData.robotsHeader"
                    :code="`X-Robots-Tag: ${pathDebugData.robotsHeader}`"
                    lang="bash"
                  />
                  <div
                    v-if="pathDebugData?.debug"
                    class="flex gap-2 flex-wrap"
                  >
                    <UBadge
                      v-if="pathDebugData?.debug?.source"
                      color="neutral"
                      variant="subtle"
                      size="xs"
                    >
                      Source: {{ pathDebugData?.debug?.source }}
                    </UBadge>
                    <UBadge
                      v-if="pathDebugData?.debug?.line"
                      color="neutral"
                      variant="subtle"
                      size="xs"
                    >
                      {{ pathDebugData?.debug?.line }}
                    </UBadge>
                  </div>
                </div>
              </OSectionBlock>

              <!-- Site Indexable -->
              <OSectionBlock
                icon="carbon:earth"
                text="Site Indexable"
              >
                <div class="space-y-4">
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
                      <template v-if="globalDebugData?.indexable">
                        Robots can crawl your site.
                      </template>
                      <template v-else>
                        Robots are blocked from crawling your site.
                      </template>
                    </span>
                  </div>
                  <div
                    v-if="globalDebugData?.hints?.length"
                    class="hint-callout"
                  >
                    <UIcon
                      name="carbon:information"
                      class="hint-callout-icon text-lg flex-shrink-0 mt-0.5"
                    />
                    <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
                      <li v-for="(hint, key) in globalDebugData?.hints" :key="key">
                        {{ hint.replace(' with ?mockProductionEnv query.', '.') }}
                      </li>
                    </ul>
                  </div>
                </div>
              </OSectionBlock>

              <!-- robots.txt -->
              <OSectionBlock
                icon="carbon:document-blank"
                text="/robots.txt"
              >
                <OCodeBlock :code="globalDebugData.robotsTxt" lang="robots-txt" />
              </OSectionBlock>
            </div>

            <!-- Debug Tab -->
            <div
              v-else-if="tab === 'debug'"
              class="space-y-5 animate-fade-up"
            >
              <OSectionBlock
                icon="carbon:settings"
                text="Runtime Config"
              >
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
  transition: all 150ms cubic-bezier(0.22, 1, 0.36, 1);
  background: transparent;
  border: none;
  cursor: pointer;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.nav-action:hover {
  color: var(--color-text) !important;
  background: var(--color-surface-sunken) !important;
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

textarea:focus {
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

.no-main-menu {
  border: none !important;
}

.jse-main {
  min-height: 1em !important;
}

.jse-contents {
  border-width: 0 !important;
  border-radius: var(--radius-md) !important;
}

/* Hide scrollbar utility */
.no-scrollbar::-webkit-scrollbar {
  display: none;
  width: 0 !important;
  height: 0 !important;
}

.no-scrollbar {
  scrollbar-width: none;
}
</style>
