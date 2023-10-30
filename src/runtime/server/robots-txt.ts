import { defineEventHandler, getQuery, setHeader } from 'h3'
import { generateRobotsTxt } from '../robotsTxt/generateRobotsTxt'
import type { RobotsGroupResolved } from '../types'
import { useNitroApp, useRuntimeConfig, useSiteConfig, withSiteUrl } from '#imports'

export default defineEventHandler(async (e) => {
  const query = getQuery(e)
  setHeader(e, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(e, 'Cache-Control', import.meta.dev ? 'no-store' : 'max-age=14400, must-revalidate')

  const { groups, sitemap, credits } = useRuntimeConfig()['nuxt-simple-robots']
  const { indexable, _context } = useSiteConfig(e, { debug: import.meta.dev })

  // allow previewing with ?indexable
  const queryIndexableEnabled = String(query.indexable) === 'true' || query.indexable === ''
  let sitemaps: string[] = [...(Array.isArray(sitemap) ? sitemap : [sitemap])]
    // validate sitemaps are absolute
    .map((s) => {
      // ensure base
      if (!s.startsWith('http'))
        return withSiteUrl(e, s, { withBase: true, absolute: true })
      return s
    })
  // dedupe sitemaps
  sitemaps = [...new Set(sitemaps)]

  let computedIndexable = indexable
  const isRobotsGroupConfigBlockingIndexing = (groups as RobotsGroupResolved[]).some(
    g => g.userAgent.includes('*') && g.disallow.includes('/'),
  )
  if (computedIndexable && isRobotsGroupConfigBlockingIndexing)
    computedIndexable = false
  const devHints: string[] = []
  if (import.meta.dev) {
    if (isRobotsGroupConfigBlockingIndexing) {
      devHints.push('Robots config is blocking indexing.')
    }
    else {
      if (queryIndexableEnabled && _context.indexable === 'computed-env') {
        computedIndexable = true
        devHints.push('You are mocking a production enviroment with ?indexable query.')
      }
      else if (!computedIndexable && !indexable) {
        if (_context.indexable === 'computed-env')
          devHints.push(`Indexing is blocked because of the environment. You can mock a production environment with ?indexable query.`)
        else
          devHints.push(`Indexing is blocked by site config set by ${_context.indexable}.`)
      }
    }
  }
  if (!computedIndexable) {
    // no point adding sitemaps if not indexable
    sitemaps = []
  }
  const robotGroups: RobotsGroupResolved[] = computedIndexable
    ? ([...groups] as RobotsGroupResolved[])
    : [
        {
          allow: [],
          comment: [],
          userAgent: ['*'],
          disallow: ['/'],
        },
      ]

  let robotsTxt: string = generateRobotsTxt({ groups: robotGroups, sitemaps })
  if (import.meta.dev && devHints.length) {
    // append
    robotsTxt += `\n# DEVELOPMENT HINTS: ${devHints.join(', ')}\n`
  }
  if (credits) {
    robotsTxt = [
      `# START nuxt-simple-robots (${computedIndexable ? 'indexable' : 'indexing disabled'})`,
      robotsTxt,
      '# END nuxt-simple-robots',
    ].filter(Boolean).join('\n')
  }

  const hookCtx = { robotsTxt }
  const nitro = useNitroApp()
  await nitro.hooks.callHook('robots:robots-txt', hookCtx)
  return hookCtx.robotsTxt
})
