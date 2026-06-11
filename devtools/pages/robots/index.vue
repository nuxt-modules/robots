<script setup lang="ts">
import { isProductionMode, path } from 'nuxtseo-layer-devtools/composables/state'
import { computed } from 'vue'
import { overview, pathDebugData, productionLoading } from '../../lib/robots/state'

const metaTag = computed(() => {
  const content = pathDebugData.value?.rule || ''
  return `<meta name="robots" content="${content}">`
})

const subtitle = computed(() => isProductionMode.value
  ? 'Inspecting the robots.txt from your deployed site.'
  : 'Page and site indexability status.')
</script>

<template>
  <div class="space-y-5 animate-fade-up">
    <div>
      <h2 class="text-lg font-semibold mb-1">
        Overview
      </h2>
      <p class="text-xs text-[var(--color-text-muted)]">
        {{ subtitle }}
      </p>
    </div>

    <DevtoolsLoading v-if="isProductionMode && productionLoading" />
    <DevtoolsProductionError v-else-if="isProductionMode && (!overview || overview.error)" />

    <template v-else>
      <!-- Page Indexable (per-path, local only) -->
      <DevtoolsSection
        v-if="!isProductionMode"
        icon="carbon:document"
        text="Page Indexable"
      >
        <DevtoolsLoading v-if="!pathDebugData" />
        <div v-else class="space-y-4">
          <div class="flex items-center gap-3">
            <DevtoolsAlert
              v-if="pathDebugData?.indexable && pathDebugData.crawlable"
              icon="carbon:checkmark"
              variant="success"
            >
              Indexable
            </DevtoolsAlert>
            <DevtoolsAlert
              v-else
              icon="carbon:warning"
              variant="warning"
            >
              Not Indexable
            </DevtoolsAlert>
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
          <DevtoolsSnippet :code="metaTag" lang="xml" />
          <DevtoolsSnippet
            v-if="pathDebugData.robotsHeader"
            :code="`X-Robots-Tag: ${pathDebugData.robotsHeader}`"
            lang="js"
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
      </DevtoolsSection>

      <!-- Site Indexable -->
      <DevtoolsSection
        icon="carbon:earth"
        text="Site Indexable"
      >
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <DevtoolsAlert
              v-if="overview?.indexable"
              icon="carbon:checkmark"
              variant="success"
            >
              Crawlable
            </DevtoolsAlert>
            <DevtoolsAlert
              v-else
              icon="carbon:warning"
              variant="warning"
            >
              Blocked
            </DevtoolsAlert>
            <span class="text-sm text-[var(--color-text-muted)]">
              <template v-if="overview?.indexable">
                Robots can crawl your {{ isProductionMode ? 'production ' : '' }}site.
              </template>
              <template v-else>
                Robots are blocked from crawling your {{ isProductionMode ? 'production ' : '' }}site.
              </template>
            </span>
          </div>
          <DevtoolsAlert
            v-if="overview?.hints?.length"
            icon="carbon:information"
            variant="info"
          >
            <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
              <li v-for="(hint, key) in overview?.hints" :key="key">
                {{ hint }}
              </li>
            </ul>
          </DevtoolsAlert>
          <DevtoolsAlert
            v-if="isProductionMode && overview && 'hasRemoteDebug' in overview && !overview.hasRemoteDebug"
            icon="carbon:information"
            variant="info"
          >
            <span class="text-xs">Deploy with <code class="px-1 py-0.5 rounded bg-[var(--color-surface-sunken)]">robots: { debug: true }</code> for full debug data.</span>
          </DevtoolsAlert>
        </div>
      </DevtoolsSection>

      <!-- robots.txt -->
      <DevtoolsSection
        icon="carbon:document-blank"
        text="/robots.txt"
      >
        <template #actions>
          <DevtoolsAlert
            v-if="overview?.validation?.errors?.length"
            icon="carbon:warning"
            variant="warning"
          >
            {{ overview.validation.errors.length }} error{{ overview.validation.errors.length === 1 ? '' : 's' }}
          </DevtoolsAlert>
          <DevtoolsAlert
            v-if="overview?.validation?.warnings?.length"
            icon="carbon:warning-alt"
            variant="warning"
          >
            {{ overview.validation.warnings.length }} warning{{ overview.validation.warnings.length === 1 ? '' : 's' }}
          </DevtoolsAlert>
          <DevtoolsAlert
            v-else-if="overview?.validation && !overview?.validation?.errors?.length"
            icon="carbon:checkmark"
            variant="success"
          >
            Valid
          </DevtoolsAlert>
        </template>

        <DevtoolsSnippet v-if="overview?.robotsTxt" :code="overview.robotsTxt" lang="robots-txt" />

        <!-- Validation errors -->
        <DevtoolsAlert
          v-if="overview?.validation?.errors?.length"
          icon="carbon:warning"
          variant="warning"
        >
          <div class="flex flex-col gap-2">
            <span class="text-xs font-semibold">Validation Issues</span>
            <ul class="space-y-1">
              <li
                v-for="(err, i) in overview.validation.errors"
                :key="i"
                class="text-xs font-mono text-[var(--color-text-muted)]"
              >
                {{ err }}
              </li>
            </ul>
          </div>
        </DevtoolsAlert>

        <!-- Validation warnings -->
        <DevtoolsAlert
          v-if="overview?.validation?.warnings?.length"
          icon="carbon:warning-alt"
          variant="warning"
        >
          <div class="flex flex-col gap-2">
            <span class="text-xs font-semibold">Warnings</span>
            <ul class="space-y-1">
              <li
                v-for="(warn, i) in overview.validation.warnings"
                :key="i"
                class="text-xs font-mono text-[var(--color-text-muted)]"
              >
                {{ warn }}
              </li>
            </ul>
          </div>
        </DevtoolsAlert>

        <!-- Sitemaps -->
        <DevtoolsAlert
          v-if="overview?.validation?.sitemaps?.length"
          icon="carbon:map"
          variant="info"
        >
          <div class="flex flex-col gap-2">
            <span class="text-xs font-semibold">Sitemaps</span>
            <ul class="space-y-1">
              <li
                v-for="sitemap in overview.validation.sitemaps"
                :key="sitemap"
                class="text-xs font-mono text-[var(--color-text-muted)] truncate"
              >
                {{ sitemap }}
              </li>
            </ul>
          </div>
        </DevtoolsAlert>
      </DevtoolsSection>
    </template>
  </div>
</template>
