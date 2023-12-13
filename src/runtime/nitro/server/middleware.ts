import { defineEventHandler, setHeader } from 'h3'
import { indexableFromGroup } from '../../util'
import { createNitroRouteRuleMatcher } from '../kit'
import { resolveRobotsTxtContext } from '../util'
import { useRuntimeConfig } from '#imports'
import { useSiteConfig } from '#internal/nuxt-site-config'

export default defineEventHandler(async (e) => {
  if (e.path === '/robots.txt')
    return
  const { indexable } = useSiteConfig(e)
  const { robotsDisabledValue } = useRuntimeConfig()['nuxt-simple-robots']
  const robotsTxtCtx = await resolveRobotsTxtContext(e, indexable, 'middleware')

  // add noindex header
  const routeRuleMatcher = createNitroRouteRuleMatcher()
  const routeRules = routeRuleMatcher(e.path)
  if (typeof routeRules.robots === 'string') {
    setHeader(e, 'X-Robots-Tag', routeRules.robots)
    e.context.robots = {
      rule: routeRules.robots,
      indexable: !routeRules.robots.includes('noindex'),
    }
    return
  }
  if (routeRules.index === false || indexable === false) {
    setHeader(e, 'X-Robots-Tag', robotsDisabledValue)
    e.context.robots = {
      rule: robotsDisabledValue,
      indexable: false,
    }
    return
  }
  const groupIndexable = indexableFromGroup(robotsTxtCtx.groups, e.path)
  if (!groupIndexable) {
    setHeader(e, 'X-Robots-Tag', robotsDisabledValue)
    e.context.robots = {
      rule: robotsDisabledValue,
      indexable: false,
    }
  }
})
