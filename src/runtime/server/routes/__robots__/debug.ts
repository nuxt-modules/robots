import { getSiteConfig } from '#site-config/server/composables/getSiteConfig'
import { parseRobotsTxt, validateRobots } from '@nuxtjs/robots/util'
import { defineEventHandler, getQuery } from 'h3'
import { getSiteRobotConfig } from '../../composables/getSiteRobotConfig'
import { useRuntimeConfigNuxtRobots } from '../../composables/useRuntimeConfigNuxtRobots'

export default defineEventHandler(async (e) => {
  const runtimeConfig = useRuntimeConfigNuxtRobots(e)
  const { indexable, hints } = getSiteRobotConfig(e)
  const siteConfig = getSiteConfig(e)
  // @ts-expect-error Nuxt typed routes cause excessive type depth with $fetch
  const robotsTxt: string = await e.$fetch('/robots.txt', {
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
