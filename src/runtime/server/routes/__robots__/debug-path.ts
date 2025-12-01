import { defineEventHandler, getQuery } from 'h3'
import { withQuery } from 'ufo'
import { getPathRobotConfig } from '../../composables/getPathRobotConfig'

export default defineEventHandler(async (e) => {
  const query = getQuery(e)
  const path = query.path as string
  const isMockProduction = Boolean(query.mockProductionEnv)
  delete query.path

  let robotsHeader: string | null = null
  let robotsContent: string | null = null
  let robotsHint: string | null = null

  // try to fetch the page to get actual rendered meta tag
  const res = await $fetch.raw(withQuery(path, query)).catch(() => null)
  if (res) {
    const html = res._data
    robotsHeader = String(res.headers.get('x-robots-tag'))

    // if mocking production, use production values from headers/meta
    if (isMockProduction) {
      const productionHeader = res.headers.get('x-robots-production')
      if (productionHeader) {
        robotsHeader = String(productionHeader)
      }
      // extract production content from data-production-content attribute
      const productionMeta = String(html).match(/<meta[^>]+name=["']robots["'][^>]+data-production-content=["']([^"']+)["'](?:[^>]+data-hint=["']([^"']+)["'])?[^>]*>/i)
      if (productionMeta) {
        [, robotsContent = null, robotsHint = null] = productionMeta
      }
    }

    // if not mocking production or no production values found, use regular values
    if (!robotsContent) {
      // get robots meta tag <meta name="robots" content="noindex, nofollow" data-hint="useRobotsRule">
      // <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
      const robotsMeta = String(html).match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["'](?:[^>]+data-hint=["']([^"']+)["'])?[^>]*>/i)
      if (robotsMeta) {
        [, robotsContent = null, robotsHint = null] = robotsMeta
      }
    }
  }

  // fallback to computed config if fetch failed or no meta tag found
  if (!robotsContent) {
    const robotConfig = getPathRobotConfig(e, {
      path,
      skipSiteIndexable: isMockProduction,
    })
    robotsContent = robotConfig.rule
    robotsHint = robotConfig.debug?.source || null
    if (!robotsHeader) {
      robotsHeader = robotConfig.rule
    }
  }

  const [source, line] = robotsHint ? robotsHint.split(',') : [null, null]
  return {
    rule: robotsContent,
    indexable: !(robotsContent?.includes('noindex') && robotsHeader?.includes('noindex')),
    crawlable: !(source === '/robots.txt'),
    path,
    debug: {
      source,
      line,
    },
    robotsHeader,
    robotsContent,
  }
})
