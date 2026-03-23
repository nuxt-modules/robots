import type { NuxtDevtoolsIframeClient } from '@nuxt/devtools-kit/types'
import type { $Fetch } from 'nitropack/types'
import { computed, onMounted, onUnmounted, ref } from 'vue'

// appFetch, colorMode, devtools, useDevtoolsConnection are auto-imported from layer
// base, path, query, refreshSources are auto-imported from layer state

export const devtoolsClient = ref<NuxtDevtoolsIframeClient>()

// Connection state tracking
export const connectionState = ref<'connecting' | 'connected' | 'fallback' | 'failed'>('connecting')
export const isConnected = computed(() => connectionState.value === 'connected' || connectionState.value === 'fallback')
export const isConnectionFailed = computed(() => connectionState.value === 'failed')
export const isFallbackMode = computed(() => connectionState.value === 'fallback')

// Fallback fetch for localhost:3000
async function tryFallbackConnection() {
  const fallbackUrl = 'http://localhost:3000'
  const res = await fetch(`${fallbackUrl}/__robots__/debug.json`).catch(() => null)
  if (res?.ok) {
    appFetch.value = ((url: string, opts?: any) => fetch(`${fallbackUrl}${url}`, opts).then(r => r.json())) as $Fetch
    base.value = '/'
    path.value = '/'
    connectionState.value = 'fallback'
    return true
  }
  return false
}

// Set timeout for connection; if not connected within 2s, try fallback
onMounted(() => {
  const timer = setTimeout(async () => {
    if (connectionState.value === 'connecting') {
      const fallbackWorked = await tryFallbackConnection()
      if (!fallbackWorked) {
        connectionState.value = 'failed'
      }
    }
  }, 2000)

  onUnmounted(() => {
    clearTimeout(timer)
  })
})

useDevtoolsConnection({
  onConnected(client) {
    connectionState.value = 'connected'
    base.value = client.host.nuxt.vueApp.config.globalProperties?.$router?.options?.history?.base || client.host.app.baseURL || '/'
    const $route = client.host.nuxt.vueApp.config.globalProperties?.$route
    query.value = $route.query
    path.value = $route.path || '/'
    devtoolsClient.value = client
  },
  onRouteChange(route) {
    query.value = route.query
    path.value = route.path
    refreshSources()
  },
})
