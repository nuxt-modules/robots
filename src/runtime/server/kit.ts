import type { H3Event } from 'h3'
import type { NitroRouteConfig } from 'nitropack'
import { defu } from 'defu'
import { useRuntimeConfig } from 'nitropack/runtime'
import { createRouter as createRadixRouter, toRouteMatcher } from 'radix3'
import { withoutBase, withoutTrailingSlash } from 'ufo'

export function withoutQuery(path: string) {
  return path.split('?')[0]
}

export function createNitroRouteRuleMatcher(e?: H3Event): (path: string) => NitroRouteConfig {
  const { nitro, app } = useRuntimeConfig(e)
  const _routeRulesMatcher = toRouteMatcher(
    createRadixRouter({
      routes: Object.fromEntries(
        Object.entries(nitro?.routeRules || {})
          .map(([path, rules]) => [withoutTrailingSlash(path), rules]),
      ),
    }),
  )
  return (path: string) => {
    return defu({}, ..._routeRulesMatcher.matchAll(
      // radix3 does not support trailing slashes
      withoutBase(withoutTrailingSlash(withoutQuery(path)), app.baseURL),
    ).reverse()) as NitroRouteConfig
  }
}
