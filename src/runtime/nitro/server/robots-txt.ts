import { defineEventHandler, setHeader } from 'h3'
import { asArray, generateRobotsTxt } from '../../util'
import { resolveRobotsTxtContext } from '../util'
import type { HookRobotsConfigContext, HookRobotsTxtContext } from '../../types'
import { useNitroApp, useRuntimeConfig } from '#imports'
import { withSiteUrl } from '#internal/nuxt-site-config'
import { getSiteRobotConfig } from '#internal/nuxt-robots'

export default defineEventHandler(async (e) => {
  const nitro = useNitroApp()
  const { indexable, hints } = getSiteRobotConfig(e)
  const { credits, usingNuxtContent, cacheControl } = useRuntimeConfig(e)['nuxt-robots']
  // move towards deprecating indexable
  let robotsTxtCtx: Omit<HookRobotsConfigContext, 'context' | 'event'> = {
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
    robotsTxtCtx = await resolveRobotsTxtContext(e)
    // normalise
    robotsTxtCtx.sitemaps = [...new Set(
      asArray(robotsTxtCtx.sitemaps)
        // validate sitemaps are absolute
        .map(s => !s.startsWith('http') ? withSiteUrl(e, s, { withBase: true, absolute: true }) : s),
    )]
    if (usingNuxtContent) {
      const contentWithRobotRules = await e.$fetch<string[]>('/__robots__/nuxt-content.json', {
        headers: {
          Accept: 'application/json',
        },
      })
      // add to first '*' group
      for (const group of robotsTxtCtx.groups) {
        if (group.userAgent.includes('*')) {
          group.disallow.push(...contentWithRobotRules)
          // need to filter out empty strings since we now have some content
          group.disallow = group.disallow.filter(Boolean)
        }
      }
    }
  }
  let robotsTxt: string = generateRobotsTxt(robotsTxtCtx)
  if (import.meta.dev && hints.length) {
    // append
    robotsTxt += `\n# DEVELOPMENT HINTS:\n - ${hints.join('\n - ')}\n`
  }
  if (credits) {
    robotsTxt = [
      `# START nuxt-robots (${indexable ? 'indexable' : 'indexing disabled'})`,
      robotsTxt,
      '# END nuxt-robots',
    ].filter(Boolean).join('\n')
  }

  setHeader(e, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(e, 'Cache-Control', (import.meta.dev || import.meta.test || !cacheControl) ? 'no-store' : cacheControl)
  const hookCtx: HookRobotsTxtContext = { robotsTxt, e }
  await nitro.hooks.callHook('robots:robots-txt', hookCtx)
  return hookCtx.robotsTxt
})
