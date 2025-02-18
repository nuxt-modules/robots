import type { NuxtDevtoolsClient, NuxtDevtoolsIframeClient } from '@nuxt/devtools-kit/types'
import type { $Fetch } from 'nitropack'
import { onDevtoolsClientConnected } from '@nuxt/devtools-kit/iframe-client'
import { ref, watchEffect } from 'vue'
import { path, query, refreshSources } from '~/util/logic'

export const appFetch = ref<$Fetch>()

export const devtools = ref<NuxtDevtoolsClient>()

export const devtoolsClient = ref<NuxtDevtoolsIframeClient>()

export const colorMode = ref<'dark' | 'light'>('dark')

onDevtoolsClientConnected(async (client) => {
  appFetch.value = client.host.app.$fetch
  watchEffect(() => {
    colorMode.value = client.host.app.colorMode.value
  })
  const $route = client.host.nuxt.vueApp.config.globalProperties?.$route
  query.value = $route.query
  path.value = $route?.fullPath || '/'
  client.host.nuxt.$router.afterEach((route) => {
    query.value = route.query
    path.value = route.fullPath
    refreshSources()
  })
  devtools.value = client.devtools
  devtoolsClient.value = client
})
