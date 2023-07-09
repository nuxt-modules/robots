import { defineEventHandler, setHeader } from 'h3'
import { indexableFromGroup } from '../../util'
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
    return
  }
  if (routeRules.index === false || indexable === false) {
    setHeader(e, 'X-Robots-Tag', robotsDisabledValue)
    return
  }
  const groupIndexable = indexableFromGroup(groups, e.path)
  if (!groupIndexable)
    setHeader(e, 'X-Robots-Tag', robotsDisabledValue)
})
