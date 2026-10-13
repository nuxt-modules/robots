import type { NitroRouteConfig, NitroRouteRules } from 'nitro/types'
import { getRouteRules } from 'nitro/app'
import { defineEventHandler } from 'nuxt/server'

const routeConfig = {
  robots: { index: false, 'max-snippet': 120 },
} satisfies NitroRouteConfig

export default defineEventHandler((event) => {
  const routeRules = {
    robots: getRouteRules(event.req.method, event.url.pathname).routeRules.robots,
  } satisfies NitroRouteRules
  return {
    config: routeConfig.robots,
    resolved: routeRules.robots,
  }
})
