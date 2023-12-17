import { defineEventHandler, setHeader } from 'h3'
import { asArray, generateRobotsTxt } from '../../util'
import { resolveRobotsTxtContext } from '../util'
import type { HookRobotsConfigContext, HookRobotsTxtContext } from '../../types'
import { useNitroApp, useRuntimeConfig } from '#imports'
import { withSiteUrl } from '#internal/nuxt-site-config'
import { getSiteRobotConfig } from '#internal/nuxt-simple-robots'

export default defineEventHandler(async (e) => {
  const nitro = useNitroApp()
  setHeader(e, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(e, 'Cache-Control', (import.meta.dev || import.meta.test) ? 'no-store' : 'max-age=14400, must-revalidate')

  const { indexable, hints } = getSiteRobotConfig(e)
  const { credits } = useRuntimeConfig(e)['nuxt-simple-robots']
  // move towards deprecating indexable
  let robotsTxtCtx: Omit<HookRobotsConfigContext, 'context'> = {
    sitemaps: [],
    groups: [
      {
        allow: [],
        comment: [],
        userAgent: ['*'],
        disallow: ['/'],
      },
    ],
  }
  if (indexable) {
    robotsTxtCtx = await resolveRobotsTxtContext('robots.txt')
    // normalise
    robotsTxtCtx.sitemaps = [...new Set(
      asArray(robotsTxtCtx.sitemaps)
        // validate sitemaps are absolute
        .map(s => !s.startsWith('http') ? withSiteUrl(e, s, { withBase: true, absolute: true }) : s),
    )]
  }
  let robotsTxt: string = generateRobotsTxt(robotsTxtCtx)
  if (import.meta.dev && hints.length) {
    // append
    robotsTxt += `\n# DEVELOPMENT HINTS: ${hints.join(', ')}\n`
  }
  if (credits) {
    robotsTxt = [
      `# START nuxt-simple-robots (${indexable ? 'indexable' : 'indexing disabled'})`,
      robotsTxt,
      '# END nuxt-simple-robots',
    ].filter(Boolean).join('\n')
  }

  const hookCtx: HookRobotsTxtContext = { robotsTxt }
  await nitro.hooks.callHook('robots:robots-txt', hookCtx)
  return hookCtx.robotsTxt
})
