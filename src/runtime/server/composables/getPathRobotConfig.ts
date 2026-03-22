import type { H3Event } from 'h3'
import type { RobotsContext } from '../../types'
import { matchPathToRule, normaliseRobotsRouteRule } from '@nuxtjs/robots/util'
import { getRequestHeader } from 'h3'
import { useNitroApp, useRuntimeConfig } from 'nitropack/runtime'
import { withoutTrailingSlash } from 'ufo'
import { createNitroRouteRuleMatcher } from '../kit'
import { getSiteRobotConfig } from './getSiteRobotConfig'
import { useRuntimeConfigNuxtRobots } from './useRuntimeConfigNuxtRobots'

export function getPathRobotConfig(e: H3Event, options?: { userAgent?: string, skipSiteIndexable?: boolean, path?: string }): RobotsContext {
  const runtimeConfig = useRuntimeConfig(e)
  // has already been resolved
  const { robotsDisabledValue, robotsEnabledValue, isNuxtContentV2 } = useRuntimeConfigNuxtRobots(e)
  if (!options?.skipSiteIndexable) {
    if (!getSiteRobotConfig(e).indexable) {
      return {
        rule: robotsDisabledValue,
        indexable: false,
        debug: {
          source: 'Site Config',
        },
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
    // When skipSiteIndexable is set, skip both the group-level _indexable shortcut
    // and the blanket disallow: / rule, as these are site-level indexability signals.
    // This allows sitemaps to still generate URLs in non-indexable environments (e.g. staging)
    // while still respecting specific path disallow rules like /admin.
    if (!options?.skipSiteIndexable && group._indexable === false) {
      return {
        indexable: false,
        rule: robotsDisabledValue,
        debug: {
          source: '/robots.txt',
          line: JSON.stringify(group),
        },
      }
    }
    const rules = options?.skipSiteIndexable
      ? (group._rules || []).filter(r => r.pattern !== '/')
      : (group._rules || [])
    const robotsTxtRule = matchPathToRule(path, rules)
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

  // 3. page meta robots
  const { pageMetaRobots } = useRuntimeConfigNuxtRobots(e)
  const pageMetaRule = pageMetaRobots?.[withoutTrailingSlash(path)]
  if (typeof pageMetaRule !== 'undefined') {
    const normalised = normaliseRobotsRouteRule({ robots: pageMetaRule })
    if (normalised && (typeof normalised.allow !== 'undefined' || typeof normalised.rule !== 'undefined')) {
      return {
        indexable: normalised.allow ?? false,
        rule: normalised.rule || (normalised.allow ? robotsEnabledValue : robotsDisabledValue),
        debug: {
          source: 'Page Meta',
        },
      }
    }
  }

  // 4. nitro route rules
  nitroApp._robotsRuleMatcher = nitroApp._robotsRuleMatcher || createNitroRouteRuleMatcher(e)
  let robotRouteRules = nitroApp._robotsRuleMatcher(path)
  let routeRulesPath = path
  // if we're using i18n we need to strip leading prefixes so the rule will match
  // note this is for < v10 i18n behavior as it now handles route rules itself
  // TODO we may consider checking the version explicitly rather than the presence of the rules
  const i18nConfig = (runtimeConfig.public as Record<string, any>)?.i18n as { locales?: { code: string }[] } | undefined
  if (i18nConfig?.locales && typeof robotRouteRules.robots === 'undefined') {
    const { locales } = i18nConfig
    const locale = locales.find(l => routeRulesPath.startsWith(`/${l.code}`))
    if (locale) {
      routeRulesPath = routeRulesPath.replace(`/${locale.code}`, '')
      robotRouteRules = nitroApp._robotsRuleMatcher(routeRulesPath)
    }
  }
  const routeRules = normaliseRobotsRouteRule(robotRouteRules)
  if (routeRules && (typeof routeRules.allow !== 'undefined' || typeof routeRules.rule !== 'undefined')) {
    return {
      indexable: routeRules.allow ?? false,
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
