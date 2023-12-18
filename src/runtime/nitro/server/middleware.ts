import { defineEventHandler, setHeader } from 'h3'
import { withoutQuery } from '../kit'
import { getPathRobotConfig } from '#internal/nuxt-simple-robots'

export default defineEventHandler(async (e) => {
  if (e.path === '/robots.txt' || e.path.startsWith('/__') || e.path.startsWith('/api') || e.path.startsWith('/_nuxt'))
    return
  const robotConfig = await getPathRobotConfig(e, { path: withoutQuery(e.path), context: 'middleware' })
  setHeader(e, 'X-Robots-Tag', robotConfig.rule)
  e.context.robots = robotConfig
})
