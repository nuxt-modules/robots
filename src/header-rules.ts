import type { RobotsRouteRuleConfig } from './runtime/types'
import { createNitroRouteRuleMatcher } from 'nuxtseo-shared/server'
import { withoutTrailingSlash } from 'ufo'
import { isNoIndexRule, normaliseRobotsRouteRule } from './util'

export interface RobotsHeaderRulesInput {
  /** The route rules from the Nuxt config, including the module's own build asset rules. */
  routeRules: Record<string, RobotsRouteRuleConfig | undefined>
  /** Whether the site is indexable at build time. */
  indexable: boolean
  robotsEnabledValue: string
  robotsDisabledValue: string
  /** The build assets directory, such as `/_nuxt/`. */
  buildAssetsDir: string
}

/**
 * Resolve the `X-Robots-Tag` header for each route rule.
 *
 * Static hosts such as Cloudflare and Netlify read these rules from `_headers`.
 * They apply every rule whose pattern matches, so overlapping rules send the header twice.
 */
export function resolveRobotsHeaderRules(input: RobotsHeaderRulesInput): Record<string, string> {
  // A non-indexable site sends the same header on every response. One rule covers them all.
  if (!input.indexable)
    return { '/**': input.robotsDisabledValue }

  const buildAssetsRoutes = new Map([
    [withoutTrailingSlash(input.buildAssetsDir), withoutTrailingSlash(input.buildAssetsDir)],
    [`${input.buildAssetsDir}**`, `${input.buildAssetsDir}file.js`],
  ])
  const headerRules: Record<string, string> = {}
  const allowRoutes: string[] = []
  const noIndexRoutes: string[] = []
  for (const [route, rules] of Object.entries(input.routeRules)) {
    const robotRule = normaliseRobotsRouteRule(rules)
    if (!robotRule)
      continue
    headerRules[route] = robotRule.rule || (robotRule.allow ? input.robotsEnabledValue : input.robotsDisabledValue)
    ;(robotRule.allow ? allowRoutes : noIndexRoutes).push(route)
  }

  // A noindex rule covering an allowed route would send noindex to it: Nitro merges the more
  // specific allow over the catch-all, but static hosts apply every matching rule. Drop the
  // overlapping rule; the meta tag and the robots.txt crawling rules cover the denied paths.
  for (const route of noIndexRoutes) {
    if (!allowRoutes.length || !isNoIndexRule(headerRules[route]!))
      continue
    const matchNoIndexRule = createNitroRouteRuleMatcher<{ rule?: string }>({ nitro: { routeRules: { [route]: { rule: headerRules[route] } } } })
    if (allowRoutes.some(allowRoute => matchNoIndexRule(allowRoute.replaceAll('**', 'x').replaceAll('*', 'x')).rule))
      delete headerRules[route]
  }

  // If a user rule already sends noindex on build assets, drop the weaker built-in rule.
  const userHeaderRules = Object.fromEntries(
    Object.entries(headerRules)
      .filter(([route]) => !buildAssetsRoutes.has(route))
      .map(([route, rule]) => [route, { rule }]),
  )
  const matchUserRule = createNitroRouteRuleMatcher<{ rule?: string }>({ nitro: { routeRules: userHeaderRules } })
  for (const [route, examplePath] of buildAssetsRoutes) {
    const userRule = matchUserRule(examplePath).rule
    if (userRule && isNoIndexRule(userRule))
      delete headerRules[route]
  }
  return headerRules
}
