<script setup lang="ts">
import { navigateTo, useRoute } from '#imports'
import { computed, ref, watch } from 'vue'
import { data, productionData, refreshProductionData, refreshSources } from './composables/state'
import './composables/rpc'

await loadShiki().catch(() => {})

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
  if (p.startsWith('/debug'))
    return 'debug'
  if (p.startsWith('/docs'))
    return 'docs'
  return 'overview'
})

const navItems = [
  { value: 'overview', to: '/', icon: 'carbon:dashboard-reference', label: 'Overview', devOnly: false },
  { value: 'debug', to: '/debug', icon: 'carbon:debug', label: 'Debug', devOnly: true },
  { value: 'docs', to: '/docs', icon: 'carbon:book', label: 'Docs', devOnly: false },
]

const version = computed(() => data.value?.runtimeConfig?.version || '')

// Redirect to home when switching to production mode from a dev-only tab
watch(isProductionMode, (isProd) => {
  if (isProd && currentTab.value === 'debug')
    return navigateTo('/')
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
