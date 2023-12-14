import type { H3Event } from 'h3'
import { resolveRobotsTxtContext } from '../util'
import { createNitroRouteRuleMatcher } from '../kit'
import { indexableFromGroup, normaliseRobotsRouteRule } from '../../util'
import { useRuntimeConfig } from '#imports'
import { getSiteIndexable } from '#internal/nuxt-simple-robots'

export async function getPathRobotConfig(e: H3Event, options: { skipSiteIndexable?: boolean, path: string, context: string }) {
  const { robotsDisabledValue, robotsEnabledValue } = useRuntimeConfig()['nuxt-simple-robots']
  if (!options.skipSiteIndexable) {
    if (!getSiteIndexable(e)) {
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
  const groupIndexable = indexableFromGroup(robotsTxtCtx.groups, options.path)
  return normaliseRobotsRouteRule(routeRules, groupIndexable, robotsDisabledValue, robotsEnabledValue)
}
