import type { HookRobotsConfigContext, HookRobotsTxtContext } from '../../types'
import { logger } from '#robots/server/logger'
import { withSiteUrl } from '#site-config/server/composables/utils'
import { defineEventHandler, setHeader } from 'h3'
import { useNitroApp, useRuntimeConfig } from 'nitropack/runtime'
import { asArray, generateRobotsTxt } from '../../util'
import { getSiteRobotConfig } from '../composables/getSiteRobotConfig'
import { resolveRobotsTxtContext } from '../util'

export default defineEventHandler(async (e) => {
  const nitro = useNitroApp()
  const { indexable, hints } = getSiteRobotConfig(e)
  const { credits, isNuxtContentV2, cacheControl } = useRuntimeConfig(e)['nuxt-robots']
  // move towards deprecating indexable
  let robotsTxtCtx: Omit<HookRobotsConfigContext, 'context' | 'event'> = {
    errors: [],
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
    if (isNuxtContentV2) {
      const contentWithRobotRules = await e.$fetch<string[]>('/__robots__/nuxt-content.json', {
        headers: {
          Accept: 'application/json',
        },
      })
      // ensure it's valid json
      if (String(contentWithRobotRules).trim().startsWith('<!DOCTYPE')) {
        logger.error('Invalid HTML returned from /__robots__/nuxt-content.json, skipping.')
      }
      else {
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
  }
  let robotsTxt: string = generateRobotsTxt(robotsTxtCtx)
  if (import.meta.dev && hints.length) {
    // append
    robotsTxt += `\n# DEVELOPMENT HINTS:\n# - ${hints.join('\n# - ')}\n`
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
