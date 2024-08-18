import type { H3Event } from 'h3'
import { withoutTrailingSlash } from 'ufo'
import { useNitroApp } from 'nitropack/runtime'
import { getRequestHeader } from 'h3'
import { createNitroRouteRuleMatcher } from '../kit'
import { matchPathToRule, normaliseRobotsRouteRule } from '../../util'
import { useRuntimeConfig } from '#imports'
import { getSiteRobotConfig } from '#internal/nuxt-robots'

export function getPathRobotConfig(e: H3Event, options?: { userAgent?: string, skipSiteIndexable?: boolean, path?: string }) {
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
  const userAgent = options?.userAgent || getRequestHeader(e, 'User-Agent')
  const nitroApp = useNitroApp()
  // 1. robots txt no indexing
  const groups = [
    // run explicit user agent matching first
    ...nitroApp._robots.ctx.groups.filter((g) => {
      if (userAgent) {
        return g.userAgent.some(ua => ua.toLowerCase().includes(userAgent.toLowerCase()))
      }
      return false
    }),
    // run wildcard matches second
    ...nitroApp._robots.ctx.groups.filter(g => g.userAgent.includes('*')),
  ]
  for (const group of groups) {
    const robotsTxtRule = matchPathToRule(path, group._rules)
    if (robotsTxtRule) {
      if (!robotsTxtRule.allow) {
        return {
          allow: false,
          rule: robotsDisabledValue,
          debug: {
            source: '/robots.txt',
            line: `Disallow: ${robotsTxtRule.pattern}`,
          },
        }
      }
      // exit loop continue to other checks (explicit robots allows)
      break
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
