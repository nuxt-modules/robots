import { useRuntimeConfig } from '#imports'
import { getPathRobotConfig } from '#internal/nuxt-robots'
import { defineEventHandler, setHeader } from 'h3'

export default defineEventHandler(async (e) => {
  if (e.path === '/robots.txt' || e.path.startsWith('/__') || e.path.startsWith('/api') || e.path.startsWith('/_nuxt'))
    return
  const robotConfig = getPathRobotConfig(e)
  const { header } = useRuntimeConfig(e)['nuxt-robots']
  if (header) {
    setHeader(e, 'X-Robots-Tag', robotConfig.rule)
  }
  e.context.robots = robotConfig
})
