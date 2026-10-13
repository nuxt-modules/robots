import type { RobotsRouteRuleConfig } from '@nuxtjs/robots'
import type { AppRouteRules } from 'nuxt/server'
import { defineEventHandler, getRouteRules } from 'nuxt/server'

const routeConfig = {
  robots: { index: false, 'max-snippet': 120 },
} satisfies AppRouteRules

export default defineEventHandler((event) => {
  const robots: RobotsRouteRuleConfig['robots'] = getRouteRules(event).robots
  return {
    config: routeConfig.robots,
    resolved: robots,
  }
})
