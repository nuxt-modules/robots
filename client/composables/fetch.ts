import { envTab, path } from '../util/logic'
import { appFetch } from './rpc'
import { useAsyncData } from '#imports'

export function fetchPageDebug() {
  return useAsyncData<any>(() => {
    const query: Record<string, any> = {
      path: path.value,
    }
    if (envTab.value === 'Production')
      query.mockProductionEnv = true
    return appFetch.value('/__robots__/debug-path.json', {
      query,
    })
  }, {
    watch: [envTab, path],
  })
}

export function fetchGlobalDebug() {
  return useAsyncData<any>(() => {
    const query: Record<string, any> = {}
    if (envTab.value === 'Production')
      query.mockProductionEnv = true
    return appFetch.value('/__robots__/debug.json', {
      query,
    })
  }, {
    watch: [envTab],
  })
}
