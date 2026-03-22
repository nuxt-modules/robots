import type { NuxtDevtoolsClient, NuxtDevtoolsIframeClient } from '@nuxt/devtools-kit/types'
import type { $Fetch } from 'nitropack/types'
import { onDevtoolsClientConnected } from '@nuxt/devtools-kit/iframe-client'
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { base, path, query, refreshSources } from '../util/logic'

export const appFetch = ref<$Fetch>()

export const devtools = ref<NuxtDevtoolsClient>()

export const devtoolsClient = ref<NuxtDevtoolsIframeClient>()

export const colorMode = ref<'dark' | 'light'>('dark')

// Connection state tracking
export const connectionState = ref<'connecting' | 'connected' | 'fallback' | 'failed'>('connecting')
export const isConnected = computed(() => connectionState.value === 'connected' || connectionState.value === 'fallback')
export const isConnectionFailed = computed(() => connectionState.value === 'failed')
export const isFallbackMode = computed(() => connectionState.value === 'fallback')

let connectionTimeout: any

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

// Set timeout for connection — if not connected within 2s, try fallback
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

onDevtoolsClientConnected(async (client) => {
  if (connectionTimeout)
    clearTimeout(connectionTimeout)
  connectionState.value = 'connected'
  // @ts-expect-error untyped
  appFetch.value = client.host.app.$fetch
  // @ts-expect-error untyped
  base.value = client.host.nuxt.vueApp.config.globalProperties?.$router?.options?.history?.base || client.host.app.baseURL || '/'
  watchEffect(() => {
    colorMode.value = client.host.app.colorMode.value
  })
  const $route = client.host.nuxt.vueApp.config.globalProperties?.$route
  query.value = $route.query
  path.value = $route.path || '/'
  client.host.nuxt.$router.afterEach((route: any) => {
    query.value = route.query
    path.value = route.path
    refreshSources()
  })
  devtools.value = client.devtools
  devtoolsClient.value = client
})
