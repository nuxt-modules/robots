import { defineEventHandler, setHeader } from 'h3'
import config from 'nuxt-simple-robots/config'
import { getRouteRules } from '#internal/nitro'

export default defineEventHandler((event) => {
  if (event.path === '/robots.txt')
    return
  // add noindex header
  const siteIndexable = config.indexable
  const routeRules = getRouteRules(event)
  if (routeRules.index === false || siteIndexable === false)
    setHeader(event, 'X-Robots-Tag', config.robotsDisabledValue)
})
