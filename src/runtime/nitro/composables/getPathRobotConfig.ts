import type { H3Event } from 'h3'
import { withoutTrailingSlash } from 'ufo'
import { createNitroRouteRuleMatcher, withoutQuery } from '../kit'
import { indexableFromGroup, normaliseRobotsRouteRule } from '../../util'
import { useNitroApp, useRuntimeConfig } from '#imports'
import { getSiteRobotConfig } from '#internal/nuxt-simple-robots'

export function getPathRobotConfig(e: H3Event, options?: { skipSiteIndexable?: boolean, path?: string }) {
  // has already been resolved
  const { robotsDisabledValue, robotsEnabledValue, usingNuxtContent } = useRuntimeConfig()['nuxt-simple-robots']
  if (!options?.skipSiteIndexable) {
    if (!getSiteRobotConfig(e).indexable) {
      return {
        rule: robotsDisabledValue,
        indexable: false,
      }
    }
  }
  const path = withoutQuery(options?.path || e.path)
  const nitroApp = useNitroApp()
  // add noindex header
  const routeRuleMatcher = createNitroRouteRuleMatcher()
  const routeRules = routeRuleMatcher(path)
  let defaultIndexable = indexableFromGroup(nitroApp._robots.ctx.groups, path)
  if (usingNuxtContent) {
    if (nitroApp._robots.nuxtContentUrls.has(withoutTrailingSlash(path)))
      defaultIndexable = false
  }
  return normaliseRobotsRouteRule(routeRules, defaultIndexable, robotsDisabledValue, robotsEnabledValue)
}
