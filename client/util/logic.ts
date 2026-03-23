import { useLocalStorage } from '@vueuse/core'
import { ref } from 'vue'

// Shared state (refreshTime, hostname, path, query, base, host, refreshSources,
// slowRefreshSources, previewSource, productionUrl, hasProductionUrl, isProductionMode)
// is auto-imported from the layer

// Module-specific state
export const envTab = useLocalStorage('nuxt-robots:env-tab', 'Production')
export const globalRefreshTime = ref(Date.now())
