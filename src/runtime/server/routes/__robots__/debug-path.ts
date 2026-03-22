import { defineEventHandler, getQuery } from 'h3'
import { withQuery } from 'ufo'
import { getPathRobotConfig } from '../../composables/getPathRobotConfig'
import { extractRobotsMetaFromHtml } from '../../util/extractRobotsMetaFromHtml'

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
    const html = String(res._data)
    robotsHeader = res.headers.get('x-robots-tag') || null

    const meta = extractRobotsMetaFromHtml(html)
    if (meta) {
      // if mocking production, prefer the production specific values
      if (isMockProduction) {
        const productionHeader = res.headers.get('x-robots-production')
        if (productionHeader) {
          robotsHeader = productionHeader
        }
        if (meta.productionContent) {
          robotsContent = meta.productionContent
          robotsHint = meta.hint
        }
      }
      // use regular content value if not mocking production or no production values found
      if (!robotsContent && meta.content) {
        robotsContent = meta.content
        robotsHint = meta.hint
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
    indexable: !(robotsContent?.includes('noindex') || robotsHeader?.includes('noindex')),
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
