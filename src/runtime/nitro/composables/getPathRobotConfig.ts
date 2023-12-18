import type { H3Event } from 'h3'
import { resolveRobotsTxtContext } from '../util'
import { createNitroRouteRuleMatcher } from '../kit'
import { indexableFromGroup, normaliseRobotsRouteRule } from '../../util'
import { useRuntimeConfig } from '#imports'
import { getSiteRobotConfig } from '#internal/nuxt-simple-robots'

const nuxtContentBlockedPaths = new Set<string>()

export async function getPathRobotConfig(e: H3Event, options: { skipSiteIndexable?: boolean, path: string, context: string }) {
  const { robotsDisabledValue, robotsEnabledValue, usingNuxtContent } = useRuntimeConfig(e)['nuxt-simple-robots']
  if (!options.skipSiteIndexable) {
    if (!getSiteRobotConfig(e).indexable) {
      return {
        rule: robotsDisabledValue,
        indexable: false,
      }
    }
  }
  const robotsTxtCtx = await resolveRobotsTxtContext(options.context)
  // add noindex header
  const routeRuleMatcher = createNitroRouteRuleMatcher()
  const routeRules = routeRuleMatcher(options.path)
  let defaultIndexable = indexableFromGroup(robotsTxtCtx.groups, options.path)
  if (usingNuxtContent) {
    // just-in-time fetch of blocked paths
    if (nuxtContentBlockedPaths.size === 0) {
      const urls = await e.$fetch<string[]>('/__robots__/nuxt-content.json')
      if (urls.length)
        urls.forEach(url => nuxtContentBlockedPaths.add(url))
      else
        nuxtContentBlockedPaths.add('')
    }
    if (nuxtContentBlockedPaths.has(options.path))
      defaultIndexable = false
  }
  return normaliseRobotsRouteRule(routeRules, defaultIndexable, robotsDisabledValue, robotsEnabledValue)
}
