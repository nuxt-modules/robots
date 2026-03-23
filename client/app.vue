<script setup lang="ts">
import { useAsyncData } from '#imports'
import { useLocalStorage } from '@vueuse/core'
import { computed, watch } from 'vue'
import { robotsTxtLang } from './composables/shiki'
import { envTab } from './util/logic'
import './composables/rpc'

await loadShiki({
  extraLangs: [
    import('@shikijs/langs/html'),
    import('@shikijs/langs/bash'),
    robotsTxtLang as any,
  ],
})

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

const tab = useLocalStorage('nuxt-robots:tab', 'overview')

const navItems = [
  { value: 'overview', icon: 'carbon:dashboard-reference', label: 'Overview', devOnly: false },
  { value: 'debug', icon: 'carbon:debug', label: 'Debug', devOnly: true },
  { value: 'docs', icon: 'carbon:book', label: 'Docs', devOnly: false },
]

// Redirect to overview when switching to production mode from a dev-only tab
watch(isProductionMode, (isProd) => {
  if (isProd && tab.value === 'debug')
    tab.value = 'overview'
})
</script>

<template>
  <DevtoolsLayout
    v-model:active-tab="tab"
    title="Robots"
    icon="carbon:bot"
    :version="version"
    :nav-items="navItems"
    github-url="https://github.com/nuxt-modules/robots"
    :loading="!globalDebug || globalDebugFetch.status.value === 'pending'"
    @refresh="refreshSources"
  >
    <DevtoolsError
      v-if="globalDebugFetch.error.value"
      title="Error loading debug data"
      :error="globalDebugFetch.error.value"
    />

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
          <div v-if="!isProductionMode" class="devtools-nav-tabs">
            <button
              v-for="env of ['Production', 'Development']"
              :key="env"
              type="button"
              class="devtools-nav-tab"
              :class="env === envTab ? 'active' : ''"
              @click="envTab = env"
            >
              <div class="devtools-nav-tab-inner">
                <span class="text-xs sm:text-sm">{{ env }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Page Indexable -->
        <DevtoolsSection icon="carbon:document" text="Page Indexable">
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
            <DevtoolsSnippet :code="metaTag" lang="xml" label="Meta Tag" />
            <DevtoolsSnippet
              v-if="pathDebugData.robotsHeader"
              :code="`X-Robots-Tag: ${pathDebugData.robotsHeader}`"
              label="X-Robots-Tag"
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
        </DevtoolsSection>

        <!-- Site Indexable -->
        <DevtoolsSection icon="carbon:earth" text="Site Indexable">
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
            <DevtoolsAlert v-if="globalDebugData?.hints?.length && !isProductionMode" variant="info">
              <ul class="text-sm space-y-1">
                <li v-for="(hint, key) in globalDebugData.hints" :key="key">
                  {{ hint.replace(' with ?mockProductionEnv query.', '.') }}
                </li>
              </ul>
            </DevtoolsAlert>
          </div>
        </DevtoolsSection>

        <!-- robots.txt -->
        <DevtoolsSection icon="carbon:document-blank" text="/robots.txt">
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
          <DevtoolsSnippet :code="globalDebugData.robotsTxt" label="robots.txt" />

          <!-- Validation errors -->
          <DevtoolsAlert v-if="globalDebugData?.validation?.errors?.length" variant="warning">
            <div class="space-y-2">
              <span class="text-xs font-semibold">Validation Issues</span>
              <ul class="space-y-1">
                <li
                  v-for="(err, i) in globalDebugData.validation.errors"
                  :key="i"
                  class="text-xs font-mono"
                >
                  {{ err }}
                </li>
              </ul>
            </div>
          </DevtoolsAlert>

          <!-- Validation warnings -->
          <DevtoolsAlert v-if="globalDebugData?.validation?.warnings?.length" variant="warning">
            <div class="space-y-2">
              <span class="text-xs font-semibold">Warnings</span>
              <ul class="space-y-1">
                <li
                  v-for="(warn, i) in globalDebugData.validation.warnings"
                  :key="i"
                  class="text-xs font-mono"
                >
                  {{ warn }}
                </li>
              </ul>
            </div>
          </DevtoolsAlert>

          <!-- Sitemaps -->
          <DevtoolsAlert v-if="globalDebugData?.validation?.sitemaps?.length" variant="info">
            <div class="space-y-2">
              <span class="text-xs font-semibold">Sitemaps</span>
              <ul class="space-y-1">
                <li
                  v-for="sitemap in globalDebugData.validation.sitemaps"
                  :key="sitemap"
                  class="text-xs font-mono truncate"
                >
                  {{ sitemap }}
                </li>
              </ul>
            </div>
          </DevtoolsAlert>
        </DevtoolsSection>
      </div>

      <!-- Debug Tab -->
      <div
        v-else-if="tab === 'debug'"
        class="stagger-children space-y-4"
      >
        <DevtoolsSection icon="carbon:settings" text="Runtime Config">
          <DevtoolsSnippet
            :code="JSON.stringify(globalDebugData?.runtimeConfig || {}, null, 2)"
            lang="json"
            label="Runtime Config"
          />
        </DevtoolsSection>
      </div>

      <!-- Docs Tab -->
      <DevtoolsDocs
        v-else-if="tab === 'docs'"
        url="https://nuxtseo.com/robots"
      />
    </template>
  </DevtoolsLayout>
</template>
