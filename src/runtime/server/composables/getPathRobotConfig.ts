import type { H3Event } from 'h3'
import type { RobotsContext } from '../../types'
import { getRequestHeader } from 'h3'
import { useNitroApp, useRuntimeConfig } from 'nitropack/runtime'
import { withoutTrailingSlash } from 'ufo'
import { matchPathToRule, normaliseRobotsRouteRule } from '../../util'
import { createNitroRouteRuleMatcher } from '../kit'
import { getSiteRobotConfig } from './getSiteRobotConfig'

export function getPathRobotConfig(e: H3Event, options?: { userAgent?: string, skipSiteIndexable?: boolean, path?: string }): RobotsContext {
  // has already been resolved
  const { robotsDisabledValue, robotsEnabledValue, isNuxtContentV2 } = useRuntimeConfig()['nuxt-robots']
  if (!options?.skipSiteIndexable) {
    if (!getSiteRobotConfig(e).indexable) {
      return {
        rule: robotsDisabledValue,
        indexable: false,
      }
    }
  }
  const path = options?.path || e.path
  let userAgent = options?.userAgent
  if (!userAgent) {
    try {
      userAgent = getRequestHeader(e, 'User-Agent')
    }
    catch {
      // version conflict with sitemap module, ignore
    }
  }
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
    if (!group._indexable) {
      return {
        indexable: false,
        rule: robotsDisabledValue,
        debug: {
          source: '/robots.txt',
          line: `Disallow: /`,
        },
      }
    }
    const robotsTxtRule = matchPathToRule(path, group._rules)
    if (robotsTxtRule) {
      if (!robotsTxtRule.allow) {
        return {
          indexable: false,
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
  if (isNuxtContentV2 && nitroApp._robots?.nuxtContentUrls?.has(withoutTrailingSlash(path))) {
    return {
      indexable: false,
      rule: robotsDisabledValue,
      debug: {
        source: 'Nuxt Content',
      },
    }
  }

  // 3. nitro route rules
  nitroApp._robotsRuleMactcher = nitroApp._robotsRuleMactcher || createNitroRouteRuleMatcher()
  const routeRules = normaliseRobotsRouteRule(nitroApp._robotsRuleMactcher(path))
  if (routeRules && (typeof routeRules.allow !== 'undefined' || typeof routeRules.rule !== 'undefined')) {
    return {
      indexable: routeRules.allow,
      rule: routeRules.rule || (routeRules.allow ? robotsEnabledValue : robotsDisabledValue),
      debug: {
        source: 'Route Rules',
      },
    }
  }
  return {
    indexable: true,
    rule: robotsEnabledValue,
  }
}
