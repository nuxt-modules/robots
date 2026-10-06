import { defineEventHandler, getQuery } from 'nuxt/server'
import { getPathRobotConfig } from '../composables/getPathRobotConfig'
import { getSiteRobotConfig } from '../composables/getSiteRobotConfig'
import { useRuntimeConfigNuxtRobots } from '../composables/useRuntimeConfigNuxtRobots'

export default defineEventHandler(async (e) => {
  if (e.url.pathname === '/robots.txt' || e.url.pathname.startsWith('/__') || e.url.pathname.startsWith('/api') || e.url.pathname.startsWith('/_nuxt')) {
    // Search engines can index JSON. A non-indexable site sends noindex on these paths too.
    const { header, robotsDisabledValue } = useRuntimeConfigNuxtRobots(e)
    if (header && !getSiteRobotConfig(e).indexable)
      e.res.headers.set('X-Robots-Tag', robotsDisabledValue)
    return
  }
  const nuxtRobotsConfig = useRuntimeConfigNuxtRobots(e)
  if (nuxtRobotsConfig) {
    const { header } = nuxtRobotsConfig
    const robotConfig = getPathRobotConfig(e, { skipSiteIndexable: Boolean(getQuery(e)?.mockProductionEnv) })
    if (header) {
      e.res.headers.set('X-Robots-Tag', robotConfig.rule)
    }
    e.context.robots = robotConfig

    // also compute production config for devtools
    if (import.meta.dev) {
      const productionRobotConfig = getPathRobotConfig(e, { skipSiteIndexable: true })
      e.res.headers.set('X-Robots-Production', productionRobotConfig.rule)
      e.context.robotsProduction = productionRobotConfig
    }
  }
})
