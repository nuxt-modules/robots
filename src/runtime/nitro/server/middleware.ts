import { defineEventHandler, setHeader } from 'h3'
import { getPathRobotConfig } from '#internal/nuxt-simple-robots'

export default defineEventHandler(async (e) => {
  if (e.path === '/robots.txt')
    return
  const robotConfig = await getPathRobotConfig(e, { path: e.path, context: 'middleware' })
  setHeader(e, 'X-Robots-Tag', robotConfig.rule)
  e.context.robots = robotConfig
})
