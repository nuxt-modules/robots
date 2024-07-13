import { defineEventHandler, setHeader } from 'h3'
import { getPathRobotConfig } from '#internal/nuxt-robots'

export default defineEventHandler(async (e) => {
  if (e.path === '/robots.txt' || e.path.startsWith('/__') || e.path.startsWith('/api') || e.path.startsWith('/_nuxt'))
    return
  const robotConfig = getPathRobotConfig(e)
  setHeader(e, 'X-Robots-Tag', robotConfig.rule)
  e.context.robots = robotConfig
})
