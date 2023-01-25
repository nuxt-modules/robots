import { defineEventHandler, setHeader } from 'h3'
import { indexable, robotsDisabledValue } from '#nuxt-simple-robots/config'
import { getRouteRules } from '#internal/nitro'

export default defineEventHandler((event) => {
  if (event.path === '/robots.txt')
    return
  // add noindex header
  const routeRules = getRouteRules(event)
  if (typeof routeRules.robots === 'string')
    setHeader(event, 'X-Robots-Tag', routeRules.robots)
  else if (routeRules.index === false || indexable === false)
    setHeader(event, 'X-Robots-Tag', robotsDisabledValue)
})
