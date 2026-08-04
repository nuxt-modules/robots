import { withQuery } from 'ufo'
import { defineEventHandler, getQuery, getRequestURL } from '#nuxtseo/h3'
import { useNitroApp } from '#nuxtseo/nitro'
import { getPathRobotConfig } from '../../composables/getPathRobotConfig'
import { extractRobotsMetaFromHtml } from '../../util/extractRobotsMetaFromHtml'

type NitroInternalFetchApp = {
  localFetch: (request: string | URL | Request, init?: RequestInit) => Promise<Response>
} | {
  fetch: (request: Request) => Response | Promise<Response>
}

export default defineEventHandler(async (e) => {
  const query = getQuery(e)
  const path = query.path as string
  const isMockProduction = Boolean(query.mockProductionEnv)
  delete query.path

  let robotsHeader: string | null = null
  let robotsContent: string | null = null
  let robotsHint: string | null = null

  // try to fetch the page to get actual rendered meta tag
  const requestPath = withQuery(path, query)
  const nitroApp = useNitroApp() as unknown as NitroInternalFetchApp
  const res = await Promise.resolve('localFetch' in nitroApp
    ? nitroApp.localFetch(requestPath)
    : nitroApp.fetch(new Request(new URL(requestPath, getRequestURL(e)))))
    .catch(() => {
    // The computed route config below is the intended fallback when rendering fails.
      return null
    })
  if (res) {
    const html = await res.text()
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
