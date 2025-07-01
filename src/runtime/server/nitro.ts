import type { NitroRouteConfig } from 'nitropack/types'

export function normaliseRobotsRouteRule(config: NitroRouteConfig) {
  // parse allow
  let allow: boolean | undefined
  if (typeof config.robots === 'boolean')
    allow = config.robots
  else if (typeof config.robots === 'object' && typeof config.robots.indexable !== 'undefined')
    allow = config.robots.indexable
  // parse rule
  let rule: string | undefined
  if (typeof config.robots === 'object' && typeof config.robots.rule !== 'undefined')
    rule = config.robots.rule
  else if (typeof config.robots === 'string')
    rule = config.robots
  if (rule && !allow)
    allow = rule !== 'none' && !rule.includes('noindex')
  if (typeof allow === 'undefined' && typeof rule === 'undefined')
    return
  return {
    allow,
    rule,
  }
}
