import { getPathRobotConfig, useRuntimeConfig } from '#imports'
import { defineEventHandler, setHeader } from 'h3'

export default defineEventHandler(async (e) => {
  if (e.path === '/robots.txt' || e.path.startsWith('/__') || e.path.startsWith('/api') || e.path.startsWith('/_nuxt'))
    return
  const robotConfig = getPathRobotConfig(e)
  const nuxtRobotsConfig = useRuntimeConfig(e)['nuxt-robots']
  if (nuxtRobotsConfig) {
    const { header } = nuxtRobotsConfig
    if (header) {
      setHeader(e, 'X-Robots-Tag', robotConfig.rule)
    }
    e.context.robots = robotConfig
  }
})
