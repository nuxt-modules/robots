import { useSiteConfig } from '#site-config/server/composables/useSiteConfig'
import { parseRobotsTxt, validateRobots } from '@nuxtjs/robots/util'
import { defineEventHandler, getQuery } from 'h3'
import { getSiteRobotConfig } from '../../composables/getSiteRobotConfig'
import { useRuntimeConfigNuxtRobots } from '../../composables/useRuntimeConfigNuxtRobots'

export default defineEventHandler(async (e) => {
  const runtimeConfig = useRuntimeConfigNuxtRobots(e)
  const { indexable, hints } = getSiteRobotConfig(e)
  const siteConfig = useSiteConfig(e)
  const robotsTxt = await e.$fetch('/robots.txt' as string, {
    query: getQuery(e),
  }) as string
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
