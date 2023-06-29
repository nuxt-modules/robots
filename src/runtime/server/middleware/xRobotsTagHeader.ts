import { defineEventHandler, setHeader } from 'h3'
import { getRouteRules } from '#internal/nitro'
import { useRuntimeConfig, useSiteConfig } from '#imports'

export default defineEventHandler((e) => {
  if (e.path === '/robots.txt')
    return
  const { indexable } = useSiteConfig(e)
  const { robotsDisabledValue, groups } = useRuntimeConfig()['nuxt-simple-robots']

  // add noindex header
  const routeRules = getRouteRules(e)
  if (typeof routeRules.robots === 'string') {
    setHeader(e, 'X-Robots-Tag', routeRules.robots)
  }
  else if (routeRules.index === false || indexable === false) {
    setHeader(e, 'X-Robots-Tag', robotsDisabledValue)
  }
  else {
    // check if the route exist within any of the disallow groups and not within the allow of the same stack
    for (const group of groups) {
      if (group.disallow.some((rule: string) => e.path.startsWith(rule)) && !group.allow.some((rule: string) => e.path.startsWith(rule))) {
        setHeader(e, 'X-Robots-Tag', robotsDisabledValue)
        return
      }
    }
  }
})
