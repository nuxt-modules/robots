import type { RequestEvent } from 'nuxt/server'
import type { RobotsContext } from '../../types'
import { matchPathToRule, normaliseRobotsRouteRule } from '@nuxtjs/robots/util'
import { getRequestHeader, matchRouteRules, useRuntimeConfig } from 'nuxt/server'
import { parseURL, withoutBase, withoutTrailingSlash } from 'ufo'
// @ts-expect-error Virtual server template registered by the module.
import { withoutLocalePrefix } from '#nuxt-robots/i18n.mjs'
// @ts-expect-error Virtual server template registered by the module.
import { pageMetaMatchers } from '#nuxt-robots/page-meta.mjs'
import { useNitroApp } from '#nuxtseo/nitro'
import { getSiteRobotConfig } from './getSiteRobotConfig'
import { useRuntimeConfigNuxtRobots } from './useRuntimeConfigNuxtRobots'

export function getPathRobotConfig(e: RequestEvent, options?: { userAgent?: string, skipSiteIndexable?: boolean, path?: string }): RobotsContext {
  const runtimeConfig = useRuntimeConfig()
  // has already been resolved
  const { robotsDisabledValue, robotsEnabledValue } = useRuntimeConfigNuxtRobots(e)
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
  const path = options?.path || `${e.url.pathname}${e.url.search}`
  let userAgent = options?.userAgent
  if (!userAgent) {
    userAgent = getRequestHeader(e, 'User-Agent')
  }
  const nitroApp = useNitroApp()
  // 1. robots txt no indexing
  const groups = [
    // run explicit user agent matching first
    ...nitroApp._robots.ctx.groups.filter((g) => {
      if (userAgent) {
        // The group's product token has to be found in the user agent, not the other way around:
        // crawlers send a product string (`Mozilla/5.0 (compatible; Googlebot/2.1; ...)`), which
        // can never be a substring of `Googlebot`. Equality still matches, so a bare token passed
        // through `options.userAgent` keeps working.
        return g.userAgent.some(ua => !!ua && userAgent.toLowerCase().includes(ua.toLowerCase()))
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

  // 2. nitro route rules
  const baseURL = runtimeConfig.app.baseURL
  const matchRules = (pathOrUrl: string) => matchRouteRules(withoutBase(withoutTrailingSlash((pathOrUrl.startsWith('/') ? pathOrUrl : parseURL(pathOrUrl, baseURL).pathname).split('?')[0]!), baseURL))
  let robotRouteRules = matchRules(path)
  let routeRulesPath = path
  // if we're using i18n we need to strip leading prefixes so the rule will match
  // note this is for < v10 i18n behavior as it now handles route rules itself
  // TODO we may consider checking the version explicitly rather than the presence of the rules
  if (typeof robotRouteRules.robots === 'undefined') {
    const basePath: string = withoutLocalePrefix(routeRulesPath, runtimeConfig.public as Record<string, unknown>)
    if (basePath !== routeRulesPath) {
      routeRulesPath = basePath
      robotRouteRules = matchRules(routeRulesPath)
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
  // 3. page meta robots
  const pagePath = withoutBase(parseURL(path).pathname || '/', runtimeConfig.app.baseURL)
  const pageMetaRule = pageMetaMatchers.find((page: { re: RegExp }) => page.re.test(pagePath))?.robots
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

  return {
    indexable: true,
    rule: robotsEnabledValue,
  }
}
