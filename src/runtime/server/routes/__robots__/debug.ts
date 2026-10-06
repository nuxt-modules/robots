import { parseRobotsTxt, validateRobots } from '@nuxtjs/robots/util'
import { createError, defineEventHandler, getQuery, serverFetch } from 'nuxt/server'
import { withQuery } from 'ufo'

import { getSiteConfig } from '#site-config/server/composables/getSiteConfig'
import { getSiteRobotConfig } from '../../composables/getSiteRobotConfig'
import { useRuntimeConfigNuxtRobots } from '../../composables/useRuntimeConfigNuxtRobots'

export default defineEventHandler(async (e) => {
  const runtimeConfig = useRuntimeConfigNuxtRobots(e)
  const { indexable, hints } = getSiteRobotConfig(e)
  const siteConfig = getSiteConfig(e)
  const response = await serverFetch(e, withQuery('/robots.txt', getQuery(e)))
  if (!response.ok)
    throw createError({ status: response.status, statusText: response.statusText })
  const robotsTxt = await response.text()
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
