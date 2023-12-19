import type { H3Event } from 'h3'
import { createNitroRouteRuleMatcher } from '../kit'
import { indexableFromGroup, normaliseRobotsRouteRule } from '../../util'
import { useNitroApp, useRuntimeConfig } from '#imports'
import { getSiteRobotConfig } from '#internal/nuxt-simple-robots'

export async function getPathRobotConfig(e: H3Event, options: { skipSiteIndexable?: boolean, path: string, context: string }) {
  // has already been resolved
  const { robotsDisabledValue, robotsEnabledValue, usingNuxtContent } = useRuntimeConfig(e)['nuxt-simple-robots']
  if (!options.skipSiteIndexable) {
    if (!getSiteRobotConfig(e).indexable) {
      return {
        rule: robotsDisabledValue,
        indexable: false,
      }
    }
  }
  const nitroApp = useNitroApp()
  // add noindex header
  const routeRuleMatcher = createNitroRouteRuleMatcher()
  const routeRules = routeRuleMatcher(options.path)
  let defaultIndexable = indexableFromGroup(nitroApp._robots.ctx.groups, options.path)
  if (usingNuxtContent) {
    if (nitroApp._robots.nuxtContentUrls.has(options.path))
      defaultIndexable = false
  }
  return normaliseRobotsRouteRule(routeRules, defaultIndexable, robotsDisabledValue, robotsEnabledValue)
}
