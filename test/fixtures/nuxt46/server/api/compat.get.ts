import { getPathRobotConfig } from '#imports'
import type { RobotsRouteRuleConfig } from '@nuxtjs/robots'
import { normaliseRobotsRouteRule } from '@nuxtjs/robots/util'
import { defineEventHandler } from 'nuxt/server'

const routeRule = {
  robots: false,
} satisfies RobotsRouteRuleConfig

export default defineEventHandler(event => ({
  normalisedRouteRule: normaliseRobotsRouteRule(routeRule),
  robots: getPathRobotConfig(event, { path: '/private' }),
  routeRule,
}))
