import { defineEventHandler, getQuery, setHeader } from 'h3'
import { getPathRobotConfig } from '../composables/getPathRobotConfig'
import { useRuntimeConfigNuxtRobots } from '../composables/useRuntimeConfigNuxtRobots'

export default defineEventHandler(async (e) => {
  if (e.path === '/robots.txt' || e.path.startsWith('/__') || e.path.startsWith('/api') || e.path.startsWith('/_nuxt'))
    return
  const nuxtRobotsConfig = useRuntimeConfigNuxtRobots(e)
  if (nuxtRobotsConfig) {
    const { header } = nuxtRobotsConfig
    const robotConfig = getPathRobotConfig(e, { skipSiteIndexable: Boolean(getQuery(e)?.mockProductionEnv) })
    if (header) {
      setHeader(e, 'X-Robots-Tag', robotConfig.rule)
    }
    e.context.robots = robotConfig
  }
})
