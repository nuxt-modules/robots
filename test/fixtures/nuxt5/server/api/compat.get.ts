import type { RobotsRouteRuleConfig } from '@nuxtjs/robots'
import { normaliseRobotsRouteRule } from '@nuxtjs/robots/util'
import { defineEventHandler } from 'nuxt/server'
import { getPathRobotConfig, isBot } from '#robots/server'
import { getPathRobotConfig as getDeepPathRobotConfig } from '#robots/server/composables/getPathRobotConfig'

const routeRule = {
  robots: false,
} satisfies RobotsRouteRuleConfig

export default defineEventHandler(event => ({
  trailingRule: getPathRobotConfig(event, { path: '/slash/', skipSiteIndexable: true }),
  lateRule: getPathRobotConfig(event, { path: '/late', skipSiteIndexable: true }),
  deepRobots: getDeepPathRobotConfig(event, { path: '/private' }),
  detectedBot: isBot(event),
  normalisedRouteRule: normaliseRobotsRouteRule(routeRule),
  robots: getPathRobotConfig(event, { path: '/private' }),
  routeRule,
}))
