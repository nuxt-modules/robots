import { defineEventHandler } from 'nuxt/server'
import { getPathRobotConfig, getSiteRobotConfig } from '#robots/server'

export default defineEventHandler((event) => ({
  site: getSiteRobotConfig(event),
  page: getPathRobotConfig(event, { path: '/hidden' }),
}))
