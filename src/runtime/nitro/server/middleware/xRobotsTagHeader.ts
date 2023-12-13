import { defineEventHandler, setHeader } from 'h3'
import { indexableFromGroup } from '../../../util'
import { createNitroRouteRuleMatcher } from '../../kit'

// @ts-expect-error alias module
import { useRuntimeConfig } from '#internal/nitro'

import { useSiteConfig } from '#internal/nuxt-site-config'

export default defineEventHandler((e) => {
  if (e.path === '/robots.txt')
    return
  const { indexable } = useSiteConfig(e)
  const { robotsDisabledValue, groups } = useRuntimeConfig()['nuxt-simple-robots']

  // add noindex header
  const routeRuleMatcher = createNitroRouteRuleMatcher()
  const routeRules = routeRuleMatcher(e.path)
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
