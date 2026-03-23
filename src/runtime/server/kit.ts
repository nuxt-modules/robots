import type { H3Event } from 'h3'
import type { NitroRouteConfig } from 'nitropack'
import { createNitroRouteRuleMatcher as _createNitroRouteRuleMatcher, withoutQuery } from 'nuxtseo-shared/runtime/server/kit'

export { withoutQuery }

export function createNitroRouteRuleMatcher(_e?: H3Event): (path: string) => NitroRouteConfig {
  // TODO the H3Event param was used for useRuntimeConfig(e) but the shared version doesn't support it
  // This is kept for API compatibility, the event param is currently unused
  return _createNitroRouteRuleMatcher() as (path: string) => NitroRouteConfig
}
