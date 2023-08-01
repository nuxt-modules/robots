import { defineEventHandler, getQuery, setHeader } from 'h3'
import { generateRobotsTxt } from '../robotsTxt/generateRobotsTxt'
import type { RobotsGroupResolved } from '../types'
import { useNitroApp, useRuntimeConfig, useSiteConfig, withSiteUrl } from '#imports'

export default defineEventHandler(async (e) => {
  const query = getQuery(e)
  setHeader(e, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(e, 'Cache-Control', process.dev ? 'no-store' : 'max-age=14400, must-revalidate')

  const { groups, sitemap, credits } = useRuntimeConfig()['nuxt-simple-robots']
  const { indexable } = useSiteConfig(e)

  // allow previewing with ?indexable
  const queryIndexableEnabled = String(query.indexable) === 'true' || query.indexable === ''
  const isIndexable = (process.dev && queryIndexableEnabled) || indexable !== false

  let sitemaps: string[] = [...(Array.isArray(sitemap) ? sitemap : [sitemap])]
    // validate sitemaps are absolute
    .map((s) => {
      // ensure base
      if (!s.startsWith('http'))
        return withSiteUrl(e, s, { withBase: true, absolute: true })
      return s
    })

  let robotGroups: RobotsGroupResolved[] = [...groups]
  if (!isIndexable) {
    robotGroups = [
      {
        userAgent: ['*'],
        disallow: ['/'],
      },
    ]
    sitemaps = [] // no point adding sitemaps if not indexable
  }

  let robotsTxt: string = generateRobotsTxt({ groups: robotGroups, sitemaps })
  if (process.dev) {
    // append
    robotsTxt += `\n# Dev mode ${queryIndexableEnabled ? 'Previewing indexable. Remove ?indexable to see the default.' : ' - View the indexable output by setting ?indexable'}` + '\n'
  }
  if (credits) {
    robotsTxt = [
      `# START nuxt-simple-robots (${isIndexable ? 'indexable' : 'indexing disabled'})`,
      robotsTxt,
      '# END nuxt-simple-robots',
    ].filter(Boolean).join('\n')
  }

  const hookCtx = { robotsTxt }
  const nitro = useNitroApp()
  await nitro.hooks.callHook('robots:robots-txt', hookCtx)
  return hookCtx.robotsTxt
})
