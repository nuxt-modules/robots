<script lang="ts" setup>
import {
  appFetch,
  colorMode,
  computed,
  useAsyncData,
  useHead,
} from '#imports'
import { useLocalStorage } from '@vueuse/core'
import { loadShiki } from '~/composables/shiki'
import {
  envTab,
  path,
  refreshSources,
} from './util/logic'
import 'floating-vue/dist/style.css'

useHead({
  title: 'Nuxt Robots',
})
await loadShiki()

const globalDebugFetch = useAsyncData<{ indexable: boolean, hints: string[], runtimeConfig: { version: string } }>(() => {
  if (!appFetch.value || typeof appFetch.value !== 'function') {
    return null
  }
  const query: Record<string, any> = {}
  if (envTab.value === 'Production')
    query.mockProductionEnv = true
  return appFetch.value('/__robots__/debug.json', {
    query,
  })
}, {
  watch: [envTab, appFetch],
})
const { data: globalDebug } = globalDebugFetch

const pathDebug = useAsyncData<any>(() => {
  if (!appFetch.value || typeof appFetch.value !== 'function') {
    return null
  }
  const req: Record<string, any> = {
    path: path.value,
  }
  if (envTab.value === 'Production')
    req.mockProductionEnv = true
  return appFetch.value('/__robots__/debug-path.json', {
    query: req,
  })
}, {
  watch: [envTab, path, appFetch],
})

const pathDebugData = computed(() => pathDebug.data?.value)

const isDark = computed(() => colorMode.value === 'dark')
useHead({
  htmlAttrs: {
    class: isDark.value ? 'dark' : '',
  },
})

const globalDebugData = computed(() => globalDebug.value || {})

const version = computed(() => {
  return globalDebugData.value?.runtimeConfig?.version || ''
})

const metaTag = computed(() => {
  return `<meta name="robots" content="${pathDebugData.value?.rule}">`
})

const tab = useLocalStorage('nuxt-robots:tab', 'overview')
</script>

<template>
  <div class="relative n-bg-base flex flex-col">
    <header class="sticky top-0 z-2 px-4 pt-4">
      <div class="flex justify-between items-start" mb2>
        <div class="flex space-x-5">
          <h1 text-xl flex items-center gap-2>
            <NIcon icon="carbon:bot" class="text-blue-300" />
            Robots <NBadge class="text-sm">
              {{ version }}
            </NBadge>
          </h1>
        </div>
        <div class="flex items-center space-x-3 text-xl">
          <fieldset
            class="n-select-tabs flex flex-inline flex-wrap items-center border n-border-base rounded-lg n-bg-base"
          >
            <label
              v-for="(value, idx) of ['overview', 'debug', 'docs']"
              :key="idx"
              class="relative n-border-base hover:n-bg-active cursor-pointer"
              :class="[
                idx ? 'border-l n-border-base ml--1px' : '',
                value === tab ? 'n-bg-active' : '',
              ]"
            >
              <div v-if="value === 'overview'" :class="[value === tab ? '' : 'op35']">
                <VTooltip>
                  <div class="px-5 py-2">
                    <h2 text-lg flex items-center>
                      <NIcon icon="carbon:dashboard-reference opacity-50" />
                    </h2>
                  </div>
                  <template #popper>
                    Overview
                  </template>
                </VTooltip>
              </div>
              <div v-else-if="value === 'debug'" :class="[value === tab ? '' : 'op35']">
                <VTooltip>
                  <div class="px-5 py-2">
                    <h2 text-lg flex items-center>
                      <NIcon icon="carbon:debug opacity-50" />
                    </h2>
                  </div>
                  <template #popper>
                    Debug
                  </template>
                </VTooltip>
              </div>
              <div v-else-if="value === 'docs'" :class="[value === tab ? '' : 'op35']">
                <VTooltip>
                  <div class="px-5 py-2">
                    <h2 text-lg flex items-center>
                      <NIcon icon="carbon:book opacity-50" />
                    </h2>
                  </div>
                  <template #popper>
                    Documentation
                  </template>
                </VTooltip>
              </div>
              <input
                v-model="tab"
                type="radio"
                :value="value"
                :title="value"
                class="absolute cursor-pointer pointer-events-none inset-0 op-0.1"
              >
            </label>
          </fieldset>
          <VTooltip>
            <button text-lg="" type="button" class="n-icon-button n-button n-transition n-disabled:n-disabled" @click="refreshSources">
              <NIcon icon="carbon:reset" class="group-hover:text-green-500" />
            </button>
            <template #popper>
              Refresh
            </template>
          </VTooltip>
        </div>
        <div class="items-center space-x-3 hidden lg:flex">
          <div class="opacity-80 text-sm">
            <NLink href="https://github.com/sponsors/harlan-zw" target="_blank">
              <NIcon icon="carbon:favorite" class="mr-[2px]" />
              Sponsor
            </NLink>
          </div>
          <div class="opacity-80 text-sm">
            <NLink href="https://github.com/nuxt-modules/robots" target="_blank">
              <NIcon icon="logos:github-icon" class="mr-[2px]" />
              Submit an issue
            </NLink>
          </div>
          <a href="https://nuxtseo.com" target="_blank" class="flex items-end gap-1.5 font-semibold text-xl dark:text-white font-title">
            <NuxtSeoLogo />
          </a>
        </div>
      </div>
    </header>
    <div class="flex-row flex p4 h-full" style="min-height: calc(100vh - 64px);">
      <main class="mx-auto flex flex-col w-full bg-white dark:bg-black dark:bg-dark-700 bg-light-200 ">
        <div v-if="!globalDebug || globalDebugFetch.status.value === 'pending'">
          <NLoading />
        </div>
        <div v-else-if="globalDebugFetch.error.value">
          {{ globalDebugFetch.error.value }}
        </div>
        <div v-else-if="tab === 'overview'" class="h-full relative max-h-full">
          <fieldset
            class="mb-7 n-select-tabs flex flex-inline flex-wrap items-center border n-border-base rounded-lg n-bg-base"
          >
            <label
              v-for="(value, idx) of ['Production', 'Development']"
              :key="idx"
              class="relative n-border-base hover:n-bg-active cursor-pointer"
              :class="[
                idx ? 'border-l n-border-base ml--1px' : '',
                value === envTab ? 'n-bg-active' : '',
              ]"
            >
              <div :class="value === envTab ? '' : 'op35'" class="px-3 py-[1.5] text-lg">{{ value }}</div>
              <input
                v-model="envTab"
                type="radio"
                :value="value"
                :title="value"
                class="absolute cursor-pointer pointer-events-none inset-0 op-0.1"
              >
            </label>
          </fieldset>

          <OSectionBlock>
            <template #text>
              <h3 class="opacity-80 text-base mb-1">
                Page Indexable
              </h3>
            </template>
            <div class="px-3 py-2 space-y-5">
              <div v-if="!pathDebugData">
                <NLoading />
              </div>
              <div v-else>
                <div class="inline-flex gap-3 mb-5 items-center">
                  <div>
                    <NIcon v-if="pathDebugData?.indexable && pathDebugData.crawlable" icon="carbon:checkmark-filled" class="text-green-300" />
                    <NIcon v-else icon="carbon:warning-filled" class="text-red-300" />
                  </div>
                  <div v-if="!pathDebugData.crawlable">
                    Robots are not allowed to access <code class="opacity-60 text-sm">{{ path }}</code>.
                  </div>
                  <div v-else-if="!pathDebugData.indexable">
                    Robots are not allowed to index <code class="opacity-60 text-sm">{{ path }}</code>, however, they can access it.
                  </div>
                  <div v-else>
                    Robots can access and crawl <code class="opacity-60 text-sm">{{ path }}</code>.
                  </div>
                </div>
                <OCodeBlock :code="metaTag" lang="html" />
                <div v-if="pathDebugData.robotsHeader" class="mt-3">
                  <OCodeBlock :code="`X-Robots-Tag: ${pathDebugData.robotsHeader}`" lang="bash" />
                </div>
                <div v-if="pathDebugData?.debug" class="mt-3 flex gap-2">
                  <div v-if="pathDebugData?.debug?.source" class="text-xs text-gray-300 mt-3 border-gray-600 rounded-xl border-1 px-2 py-1 inline-flex">
                    Source: {{ pathDebugData?.debug?.source }}
                  </div>
                  <div v-if="pathDebugData?.debug?.line" class="text-xs text-gray-300 mt-3 border-gray-600 rounded-xl border-1 px-2 py-1 inline-flex">
                    {{ pathDebugData?.debug?.line }}
                  </div>
                </div>
              </div>
            </div>
          </OSectionBlock>
          <OSectionBlock>
            <template #text>
              <h3 class="opacity-80 text-base mb-1">
                Site Indexable
              </h3>
            </template>
            <div class="px-3 py-2 space-y-5">
              <div class="inline-flex gap-3 items-center">
                <div>
                  <NIcon v-if="globalDebugData?.indexable" icon="carbon:checkmark-filled" class="text-green-300" />
                  <NIcon v-else icon="carbon:warning-filled" class="text-red-300" />
                </div>
                <div v-if="globalDebugData?.indexable">
                  Robots can crawl your site.
                </div>
                <div v-else>
                  Robots are blocked from crawling your site.
                </div>
              </div>
              <ul>
                <li v-for="(hint, key) in globalDebugData?.hints" :key="key">
                  <p class="opacity-70 text-sm">
                    {{ hint.replace(' with ?mockProductionEnv query.', '.') }}
                  </p>
                </li>
              </ul>
            </div>
          </OSectionBlock>
          <OSectionBlock>
            <template #text>
              <h3 class="opacity-80 text-base mb-1">
                /robots.txt
              </h3>
            </template>
            <div class="px-3 py-2 space-y-5">
              <OCodeBlock :code="globalDebugData.robotsTxt" lang="robots-txt" />
            </div>
          </OSectionBlock>
        </div>
        <div v-else-if="tab === 'debug'" class="h-full max-h-full overflow-hidden">
          <OSectionBlock>
            <template #text>
              <h3 class="opacity-80 text-base mb-1">
                <NIcon icon="carbon:settings" class="mr-1" />
                Runtime Config
              </h3>
            </template>
            <div class="px-3 py-2 space-y-5">
              <OCodeBlock :code="JSON.stringify(globalDebugData?.runtimeConfig || {}, null, 2)" lang="json" />
            </div>
          </OSectionBlock>
        </div>
        <div v-else-if="tab === 'docs'" class="h-full max-h-full overflow-hidden">
          <iframe src="https://nuxtseo.com/robots" class="w-full h-full border-none" style="min-height: calc(100vh - 100px);" />
        </div>
      </main>
    </div>
  </div>
</template>

<style>
.tab-panels {
  width: 100%;
}
div[role="tabpanel"] {
  width: 100%;
  display: flex;
}
.splitpanes.default-theme .splitpanes__pane {
  background-color: transparent !important;
}
.dark .splitpanes.default-theme .splitpanes__splitter {
  background-color: transparent !important;
  border-left: 1px solid rgba(156, 163, 175, 0.05);
  background-image: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.05) 50%, rgba(0, 0, 0, 0));
}
.dark .splitpanes.default-theme .splitpanes__splitter:before, .splitpanes.default-theme .splitpanes__splitter:after {
  background-color: rgba(156, 163, 175, 0.3) !important;
}

header {
  -webkit-backdrop-filter: blur(2px);
  backdrop-filter: blur(2px);
  background-color: #fffc;
}

.dark header {
  background-color: #111c;
}

html {
  --at-apply: font-sans;
  overflow-y: scroll;
  overscroll-behavior: none;
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
body::-webkit-scrollbar {
  display: none;
}
body {
  /* trap scroll inside iframe */
  height: calc(100vh + 1px);
}

html.dark {
  background: #111;
  color-scheme: dark;
}

/* Markdown */
.n-markdown a {
  --at-apply: text-primary hover:underline;
}
.prose a {
  --uno: hover:text-primary;
}
.prose code::before {
  content: ""
}
.prose code::after {
  content: ""
}
.prose hr {
  --uno: border-solid border-1 border-b border-base h-1px w-full block my-2 op50;
}

/* JSON Editor */
textarea {
  background: #8881
}

:root {
  --jse-theme-color: #fff !important;
  --jse-text-color-inverse: #777 !important;
  --jse-theme-color-highlight: #eee !important;
  --jse-panel-background: #fff !important;
  --jse-background-color: var(--jse-panel-background) !important;
  --jse-error-color: #ee534150 !important;
  --jse-main-border: none !important;
}

.dark, .jse-theme-dark {
  --jse-panel-background: #111 !important;
  --jse-theme-color: #111 !important;
  --jse-text-color-inverse: #fff !important;
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
  border-radius: 5px !important;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar:horizontal {
  height: 6px;
}

::-webkit-scrollbar-corner {
  background: transparent;
}

::-webkit-scrollbar-track {
  background: var(--c-border);
  border-radius: 1px;
}

::-webkit-scrollbar-thumb {
  background: #8881;
  transition: background 0.2s ease;
  border-radius: 1px;
}

::-webkit-scrollbar-thumb:hover {
  background: #8885;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
  width: 0 !important;
  height: 0 !important;
}
</style>
