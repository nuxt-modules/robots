import { defineEventHandler, getQuery } from 'h3'
import { withQuery } from 'ufo'

export default defineEventHandler(async (e) => {
  const query = getQuery(e)
  const path = query.path as string
  delete query.path
  // we have to fetch the path to know for sure
  const res = await $fetch.raw(withQuery(path, query))
  const html = res._data
  const robotsHeader = String(res.headers.get('x-robots-tag'))
  // get robots meta tag <meta name="robots" content="noindex, nofollow" data-hint="useRobotsRule">
  // <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  const robotsMeta = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["'](?:[^>]+data-hint=["']([^"']+)["'])?[^>]*>/i)
  const [, robotsContent = null, robotsHint = null] = robotsMeta || []
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
