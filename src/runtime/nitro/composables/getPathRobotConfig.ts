import type { H3Event } from 'h3'
import { withoutTrailingSlash } from 'ufo'
import { useNitroApp } from 'nitropack/runtime'
import { createNitroRouteRuleMatcher } from '../kit'
import { matchPathToRule, normaliseRobotsRouteRule } from '../../util'
import { useRuntimeConfig } from '#imports'
import { getSiteRobotConfig } from '#internal/nuxt-robots'

export function getPathRobotConfig(e: H3Event, options?: { skipSiteIndexable?: boolean, path?: string }) {
  // has already been resolved
  const { robotsDisabledValue, robotsEnabledValue, usingNuxtContent } = useRuntimeConfig()['nuxt-robots']
  if (!options?.skipSiteIndexable) {
    if (!getSiteRobotConfig(e).indexable) {
      return {
        rule: robotsDisabledValue,
        indexable: false,
      }
    }
  }
  const path = options?.path || e.path
  const nitroApp = useNitroApp()
  // 1. robots txt no indexing
  const group = nitroApp._robots.ctx.groups.find((g) => {
    return g.userAgent.includes('*')
  })
  const robotsTxtRule = group ? matchPathToRule(path, group._rules) : null
  if (robotsTxtRule && !robotsTxtRule.allow) {
    return {
      allow: false,
      rule: robotsDisabledValue,
      debug: {
        source: '/robots.txt',
        line: `Disallow: ${robotsTxtRule.pattern}`,
      },
    }
  }

  // 2. nuxt content rules
  if (usingNuxtContent && nitroApp._robots?.nuxtContentUrls?.has(withoutTrailingSlash(path))) {
    return {
      allow: false,
      rule: robotsDisabledValue,
      debug: {
        source: 'Nuxt Content',
      },
    }
  }

  // 3. nitro route rules
  nitroApp._robotsRuleMactcher = nitroApp._robotsRuleMactcher || createNitroRouteRuleMatcher()
  const routeRules = normaliseRobotsRouteRule(nitroApp._robotsRuleMactcher(path))
  if (routeRules) {
    return {
      allow: routeRules.allow,
      rule: routeRules.rule || (routeRules.allow ? robotsEnabledValue : robotsDisabledValue),
      debug: {
        source: 'Route Rules',
      },
    }
  }
  return {
    allow: true,
    rule: robotsEnabledValue,
  }
}
