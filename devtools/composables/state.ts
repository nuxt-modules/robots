import { ref, watch } from 'vue'

export const envTab = useLocalStorage('nuxt-robots:env-tab', 'Production')

export const data = ref<{
  indexable: boolean
  hints: string[]
  runtimeConfig: { version: string }
  robotsTxt: string
  validation: { errors: string[], warnings: string[], groups: number, sitemaps: string[] }
} | null>(null)

export const pathDebugData = ref<{
  indexable: boolean
  crawlable: boolean
  rule: string
  robotsHeader?: string
  debug?: { source?: string, line?: string }
} | null>(null)

export async function refreshSources() {
  if (!appFetch.value || typeof appFetch.value !== 'function')
    return
  const query: Record<string, any> = {}
  if (envTab.value === 'Production')
    query.mockProductionEnv = true
  data.value = await appFetch.value('/__robots__/debug.json', { query })
}

export async function refreshPathDebug() {
  if (!appFetch.value || typeof appFetch.value !== 'function')
    return
  const req: Record<string, any> = { path: path.value }
  if (envTab.value === 'Production')
    req.mockProductionEnv = true
  pathDebugData.value = await appFetch.value('/__robots__/debug-path.json', { query: req })
}

// Re-fetch when env or path changes
watch([envTab, path, appFetch, refreshTime], () => {
  refreshSources()
  refreshPathDebug()
})
