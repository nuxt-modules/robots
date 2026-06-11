import type { ProductionDebugResponse } from './types'
import { appFetch } from 'nuxtseo-layer-devtools/composables/rpc'
import { isProductionMode, path, productionUrl, refreshTime } from 'nuxtseo-layer-devtools/composables/state'
import { computed, ref, watch } from 'vue'

export const data = ref<{
  indexable: boolean
  hints: string[]
  runtimeConfig: { version: string }
  robotsTxt: string
  siteConfig: { url: string, env: string, indexable: boolean }
  validation: { errors: string[], warnings: string[], groups: number, sitemaps: string[] }
} | null>(null)

export const pathDebugData = ref<{
  indexable: boolean
  crawlable: boolean
  rule: string
  robotsHeader?: string
  debug?: { source?: string, line?: string }
} | null>(null)

export const productionData = ref<ProductionDebugResponse | null>(null)
export const productionLoading = ref(false)

/**
 * Single source of truth for the Overview, driven only by the header Local/Production
 * switch (`previewSource`). Local mode reads the dev debug endpoint; Production mode
 * reads the fetched-and-validated deployed robots.txt. Both expose `indexable`, `hints`,
 * `robotsTxt` and `validation`, so the Overview renders the same sections either way.
 */
export const overview = computed(() => isProductionMode.value ? productionData.value : data.value)

export async function refreshSources() {
  if (!appFetch.value || typeof appFetch.value !== 'function')
    return
  data.value = await appFetch.value('/__robots__/debug.json')
  if (data.value?.siteConfig?.url)
    productionUrl.value = data.value.siteConfig.url
}

export async function refreshPathDebug() {
  if (!appFetch.value || typeof appFetch.value !== 'function')
    return
  pathDebugData.value = await appFetch.value('/__robots__/debug-path.json', { query: { path: path.value } })
}

export async function refreshProductionData() {
  if (!appFetch.value || !productionUrl.value)
    return
  productionLoading.value = true

  // Try full debug endpoint first (requires debug: true in production)
  const remoteDebug: ProductionDebugResponse | null = await appFetch.value('/__robots__/debug-production.json', {
    query: { url: productionUrl.value, mode: 'debug' },
  }).catch(() => null)
  if (remoteDebug && !remoteDebug.error && remoteDebug.hasRemoteDebug) {
    productionData.value = remoteDebug
    productionLoading.value = false
    return
  }

  // Fall back to robots.txt fetch and validation
  productionData.value = await appFetch.value('/__robots__/debug-production.json', {
    query: { url: productionUrl.value },
  }).catch((err: Error) => {
    console.error('Failed to fetch production robots data:', err)
    return null
  })
  productionLoading.value = false
}

// Re-fetch local debug when the inspected path or host data changes
watch([path, appFetch, refreshTime], () => {
  refreshSources()
  refreshPathDebug()
})

// Fetch production data the first time the header switch flips to Production
watch(isProductionMode, (isProd) => {
  if (isProd && !productionData.value)
    refreshProductionData()
})
