<script setup lang="ts">
import { computed } from 'vue'
import { data, envTab, pathDebugData } from '../composables/state'

const metaTag = computed(() => {
  const content = pathDebugData.value?.rule || ''
  return `<meta name="robots" content="${content}">`
})
</script>

<template>
  <div class="space-y-5 animate-fade-up">
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
    <DevtoolsSection
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
            v-if="data?.indexable"
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
            <template v-if="data?.indexable">
              Robots can crawl your site.
            </template>
            <template v-else>
              Robots are blocked from crawling your site.
            </template>
          </span>
        </div>
        <DevtoolsAlert
          v-if="data?.hints?.length"
          icon="carbon:information"
          variant="info"
        >
          <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
            <li v-for="(hint, key) in data?.hints" :key="key">
              {{ hint.replace(' with ?mockProductionEnv query.', '.') }}
            </li>
          </ul>
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
          v-if="data?.validation?.errors?.length"
          icon="carbon:warning"
          variant="warning"
        >
          {{ data.validation.errors.length }} error{{ data.validation.errors.length === 1 ? '' : 's' }}
        </DevtoolsAlert>
        <DevtoolsAlert
          v-if="data?.validation?.warnings?.length"
          icon="carbon:warning-alt"
          variant="warning"
        >
          {{ data.validation.warnings.length }} warning{{ data.validation.warnings.length === 1 ? '' : 's' }}
        </DevtoolsAlert>
        <DevtoolsAlert
          v-else-if="data?.validation && !data?.validation?.errors?.length"
          icon="carbon:checkmark"
          variant="success"
        >
          Valid
        </DevtoolsAlert>
      </template>

      <DevtoolsSnippet :code="data?.robotsTxt" lang="robots-txt" />

      <!-- Validation errors -->
      <DevtoolsAlert
        v-if="data?.validation?.errors?.length"
        icon="carbon:warning"
        variant="warning"
      >
        <div class="flex flex-col gap-2">
          <span class="text-xs font-semibold">Validation Issues</span>
          <ul class="space-y-1">
            <li
              v-for="(err, i) in data.validation.errors"
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
        v-if="data?.validation?.warnings?.length"
        icon="carbon:warning-alt"
        variant="warning"
      >
        <div class="flex flex-col gap-2">
          <span class="text-xs font-semibold">Warnings</span>
          <ul class="space-y-1">
            <li
              v-for="(warn, i) in data.validation.warnings"
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
        v-if="data?.validation?.sitemaps?.length"
        icon="carbon:map"
        variant="info"
      >
        <div class="flex flex-col gap-2">
          <span class="text-xs font-semibold">Sitemaps</span>
          <ul class="space-y-1">
            <li
              v-for="sitemap in data.validation.sitemaps"
              :key="sitemap"
              class="text-xs font-mono text-[var(--color-text-muted)] truncate"
            >
              {{ sitemap }}
            </li>
          </ul>
        </div>
      </DevtoolsAlert>
    </DevtoolsSection>
  </div>
</template>
