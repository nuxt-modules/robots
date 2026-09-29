import { defineEventHandler, getQuery, setHeader } from '#nuxtseo/h3'
import { getPathRobotConfig } from '../composables/getPathRobotConfig'
import { getSiteRobotConfig } from '../composables/getSiteRobotConfig'
import { useRuntimeConfigNuxtRobots } from '../composables/useRuntimeConfigNuxtRobots'

export default defineEventHandler(async (e) => {
  if (e.path === '/robots.txt' || e.path.startsWith('/__') || e.path.startsWith('/api') || e.path.startsWith('/_nuxt')) {
    // Search engines can index JSON. A non-indexable site sends noindex on these paths too.
    const { header, robotsDisabledValue } = useRuntimeConfigNuxtRobots(e)
    if (header && !getSiteRobotConfig(e).indexable)
      setHeader(e, 'X-Robots-Tag', robotsDisabledValue)
    return
  }
  const nuxtRobotsConfig = useRuntimeConfigNuxtRobots(e)
  if (nuxtRobotsConfig) {
    const { header } = nuxtRobotsConfig
    const robotConfig = getPathRobotConfig(e, { skipSiteIndexable: Boolean(getQuery(e)?.mockProductionEnv) })
    if (header) {
      setHeader(e, 'X-Robots-Tag', robotConfig.rule)
    }
    e.context.robots = robotConfig

    // also compute production config for devtools
    if (import.meta.dev) {
      const productionRobotConfig = getPathRobotConfig(e, { skipSiteIndexable: true })
      setHeader(e, 'X-Robots-Production', productionRobotConfig.rule)
      e.context.robotsProduction = productionRobotConfig
    }
  }
})
