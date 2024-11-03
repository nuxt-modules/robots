import { getSiteRobotConfig, useRuntimeConfig, useSiteConfig } from '#imports'
import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (e) => {
  const runtimeConfig = useRuntimeConfig(e)['nuxt-robots']
  const { indexable, hints } = await getSiteRobotConfig(e)
  const siteConfig = useSiteConfig(e)
  const robotsTxt = await e.$fetch('/robots.txt', {
    query: getQuery(e),
  })
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
  }
})
