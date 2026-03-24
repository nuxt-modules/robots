import type { ProductionDebugResponse } from '../../src/runtime/server/routes/__robots__/debug-production'
import { ref, watch } from 'vue'

export const mockProduction = useLocalStorage('nuxt-robots:mock-production', false)

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

export async function refreshSources() {
  if (!appFetch.value || typeof appFetch.value !== 'function')
    return
  const query: Record<string, any> = {}
  if (mockProduction.value)
    query.mockProductionEnv = true
  data.value = await appFetch.value('/__robots__/debug.json', { query })
  if (data.value?.siteConfig?.url)
    productionUrl.value = data.value.siteConfig.url
}

export async function refreshPathDebug() {
  if (!appFetch.value || typeof appFetch.value !== 'function')
    return
  const req: Record<string, any> = { path: path.value }
  if (mockProduction.value)
    req.mockProductionEnv = true
  pathDebugData.value = await appFetch.value('/__robots__/debug-path.json', { query: req })
}

export async function refreshProductionData() {
  if (!appFetch.value || !productionUrl.value)
    return
  productionLoading.value = true

  // Try full debug endpoint first (requires debug: true in production)
  const remoteDebug = await appFetch.value('/__robots__/debug-production.json', {
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

// Re-fetch when env or path changes
watch([mockProduction, path, appFetch, refreshTime], () => {
  refreshSources()
  refreshPathDebug()
})

// Fetch production data when switching to production mode
watch(isProductionMode, (isProd) => {
  if (isProd && !productionData.value)
    refreshProductionData()
})
