<script setup lang="ts">
import { computed, ref } from 'vue'
import { data, refreshSources } from './composables/state'
import './composables/rpc'

await loadShiki().catch(() => {})

const refreshing = ref(false)

async function refresh() {
  if (refreshing.value)
    return
  refreshing.value = true
  data.value = null
  await refreshSources()
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
  { value: 'overview', to: '/', icon: 'carbon:dashboard-reference', label: 'Overview' },
  { value: 'debug', to: '/debug', icon: 'carbon:debug', label: 'Debug' },
  { value: 'docs', to: '/docs', icon: 'carbon:book', label: 'Docs' },
]

const version = computed(() => data.value?.runtimeConfig?.version || '')
</script>

<template>
  <DevtoolsLayout
    v-model:active-tab="currentTab"
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
