import { parseRobotsTxt, validateRobots } from '@nuxtjs/robots/util'
import { defineEventHandler, getQuery } from '#nuxtseo/h3'
import { fetchWithEvent } from '#nuxtseo/nitro'
import { getSiteConfig } from '#site-config/server/composables/getSiteConfig'
import { getSiteRobotConfig } from '../../composables/getSiteRobotConfig'
import { useRuntimeConfigNuxtRobots } from '../../composables/useRuntimeConfigNuxtRobots'

export default defineEventHandler(async (e) => {
  const runtimeConfig = useRuntimeConfigNuxtRobots(e)
  const { indexable, hints } = getSiteRobotConfig(e)
  const siteConfig = getSiteConfig(e)
  const robotsTxt = await fetchWithEvent<string>(e, '/robots.txt', {
    query: getQuery(e),
  })
  const parsed = validateRobots(parseRobotsTxt(robotsTxt))
  return {
    robotsTxt,
    indexable,
    hints,
    runtimeConfig,
    siteConfig: {
      url: siteConfig.url,
      env: siteConfig.env,
      indexable: siteConfig.indexable,
    },
    validation: {
      errors: parsed.errors,
      warnings: parsed.warnings,
      groups: parsed.groups.length,
      sitemaps: parsed.sitemaps,
    },
  }
})
