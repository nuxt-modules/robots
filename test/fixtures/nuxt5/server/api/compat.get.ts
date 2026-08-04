import { getPathRobotConfig } from '#imports'
import type { RobotsRouteRuleConfig } from '@nuxtjs/robots'
import { normaliseRobotsRouteRule } from '@nuxtjs/robots/util'
import { eventHandler } from 'nitro/h3'

const routeRule = {
  robots: false,
} satisfies RobotsRouteRuleConfig

export default eventHandler(event => ({
  normalisedRouteRule: normaliseRobotsRouteRule(routeRule),
  robots: getPathRobotConfig(event, { path: '/private' }),
  routeRule,
}))
