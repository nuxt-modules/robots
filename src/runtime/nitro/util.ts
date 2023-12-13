import type { H3Event } from 'h3'
import type { HookRobotsConfigContext, RobotsGroupResolved } from '../types'
import { withSiteUrl } from '#internal/nuxt-site-config'
import { useNitroApp, useRuntimeConfig } from '#imports'

export async function resolveRobotsTxtContext(e: H3Event, indexable: boolean, ctx: 'robots.txt' | 'middleware') {
  const nitro = useNitroApp()
  const { groups, sitemap } = useRuntimeConfig()['nuxt-simple-robots']
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
  if (!indexable) {
    // no point adding sitemaps if not indexable
    sitemaps = []
  }
  const robotGroups: RobotsGroupResolved[] = indexable
    ? ([...groups] as RobotsGroupResolved[])
    : [
        {
          allow: [],
          comment: [],
          userAgent: ['*'],
          disallow: ['/'],
        },
      ]

  const generateRobotsTxtCtx: HookRobotsConfigContext = { groups: robotGroups, sitemaps, context: ctx }
  await nitro.hooks.callHook('robots:config', generateRobotsTxtCtx)
  return generateRobotsTxtCtx
}
