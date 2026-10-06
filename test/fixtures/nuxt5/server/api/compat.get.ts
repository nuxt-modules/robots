import { getPathRobotConfig as getDeepPathRobotConfig } from '#robots/server/composables/getPathRobotConfig'
import { getPathRobotConfig, isBot } from '#robots/server'
import type { RobotsRouteRuleConfig } from '@nuxtjs/robots'
import { normaliseRobotsRouteRule } from '@nuxtjs/robots/util'
import { defineEventHandler } from 'nuxt/server'

const routeRule = {
  robots: false,
} satisfies RobotsRouteRuleConfig

export default defineEventHandler(event => ({
  deepRobots: getDeepPathRobotConfig(event, { path: '/private' }),
  detectedBot: isBot(event),
  normalisedRouteRule: normaliseRobotsRouteRule(routeRule),
  robots: getPathRobotConfig(event, { path: '/private' }),
  routeRule,
}))
