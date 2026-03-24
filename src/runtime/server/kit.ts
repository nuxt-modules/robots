import type { H3Event } from 'h3'
import type { NitroRouteRules } from 'nitropack'
import { defu } from 'defu'
import { useRuntimeConfig } from 'nitropack/runtime'
import { createRouter as createRadixRouter, toRouteMatcher } from 'radix3'
import { withoutBase, withoutTrailingSlash } from 'ufo'

function withoutQuery(path: string): string {
  return String(path.split('?')[0])
}

export function createNitroRouteRuleMatcher(e?: H3Event): (path: string) => NitroRouteRules {
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
      withoutBase(withoutTrailingSlash(withoutQuery(path)), app.baseURL),
    ).reverse()) as NitroRouteRules
  }
}
