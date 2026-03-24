import { refreshPathDebug, refreshSources } from './state'

useDevtoolsConnection({
  onConnected(client) {
    base.value = client.host.nuxt.vueApp.config.globalProperties?.$router?.options?.history?.base || client.host.app.baseURL || '/'
    const $route = client.host.nuxt.vueApp.config.globalProperties?.$route
    query.value = $route.query
    path.value = $route.path || '/'
    refreshSources()
    refreshPathDebug()
  },
  onRouteChange(route) {
    query.value = route.query
    path.value = route.path
    refreshSources()
    refreshPathDebug()
  },
})
