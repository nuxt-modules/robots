<script setup lang="ts">
import { isProductionMode } from 'nuxtseo-layer-devtools/composables/state'
import { computed, ref, watch } from 'vue'
import { navigateTo, useRoute } from '#imports'
import { loadShiki } from '../lib/robots/shiki'
import { data, productionData, refreshProductionData, refreshSources } from '../lib/robots/state'
import '../lib/robots/rpc'

await loadShiki().catch((err) => {
  console.error(err)
})

const refreshing = ref(false)

async function refresh() {
  if (refreshing.value)
    return
  refreshing.value = true
  data.value = null
  productionData.value = null
  await refreshSources()
  if (isProductionMode.value)
    await refreshProductionData()
  setTimeout(() => {
    refreshing.value = false
  }, 300)
}

const route = useRoute()
const currentTab = computed(() => {
  const p = route.path
  if (p.startsWith('/robots/debug'))
    return 'debug'
  if (p.startsWith('/robots/docs'))
    return 'docs'
  return 'overview'
})

const navItems = [
  { value: 'overview', to: '/robots', icon: 'carbon:dashboard-reference', label: 'Overview', devOnly: false },
  { value: 'debug', to: '/robots/debug', icon: 'carbon:debug', label: 'Debug', devOnly: true },
  { value: 'docs', to: '/robots/docs', icon: 'carbon:book', label: 'Docs', devOnly: false },
]

const version = computed(() => data.value?.runtimeConfig?.version || '')

watch(isProductionMode, (isProd) => {
  if (isProd && currentTab.value === 'debug')
    return navigateTo('/robots')
})
</script>

<template>
  <DevtoolsLayout
    v-model:active-tab="currentTab"
    module-name="nuxt-robots"
    title="Robots"
    icon="carbon:bot"
    :version="version"
    :nav-items="navItems"
    github-url="https://github.com/nuxt-modules/robots"
    :loading="!data || refreshing"
    @refresh="refresh"
  >
    <NuxtPage />
  </DevtoolsLayout>
</template>
