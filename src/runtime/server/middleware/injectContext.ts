import { defineEventHandler, setHeader } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { getPathRobotConfig } from '../composables/getPathRobotConfig'

export default defineEventHandler(async (e) => {
  if (e.path === '/robots.txt' || e.path.startsWith('/__') || e.path.startsWith('/api') || e.path.startsWith('/_nuxt'))
    return
  const nuxtRobotsConfig = useRuntimeConfig(e)['nuxt-robots']
  if (nuxtRobotsConfig) {
    const { header } = nuxtRobotsConfig
    const robotConfig = getPathRobotConfig(e)
    if (header) {
      setHeader(e, 'X-Robots-Tag', robotConfig.rule)
    }
    e.context.robots = robotConfig
  }
})
