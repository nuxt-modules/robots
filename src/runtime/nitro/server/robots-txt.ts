import { defineEventHandler, getQuery, setHeader } from 'h3'
import { asArray, generateRobotsTxt } from '../../util'
import { resolveRobotsTxtContext } from '../util'
import type { HookRobotsConfigContext, HookRobotsTxtContext, ParsedRobotsTxt } from '../../types'
import { useNitroApp, useRuntimeConfig, useSiteConfig } from '#imports'
import { withSiteUrl } from '#internal/nuxt-site-config'
import { getSiteIndexable } from '#internal/nuxt-simple-robots'

export default defineEventHandler(async (e) => {
  const nitro = useNitroApp()
  const query = getQuery(e)
  setHeader(e, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(e, 'Cache-Control', (import.meta.dev || import.meta.test) ? 'no-store' : 'max-age=14400, must-revalidate')

  const { credits, groups } = useRuntimeConfig()['nuxt-simple-robots']
  // move towards deprecating indexable
  const { _context } = useSiteConfig(e, { debug: import.meta.dev })
  const devHints: string[] = []
  let siteIndexable = getSiteIndexable(e)
  // get wildcard groups and which if they include an exclude for `/`
  if ((groups as ParsedRobotsTxt['groups']).some(g => g.userAgent.includes('*') && g.disallow.includes('/'))) {
    siteIndexable = false
    devHints.push('You have a disallow rule with `/` which blocks all routes.')
  }
  // allow previewing with ?indexable
  const queryIndexableEnabled = String(query.indexable) === 'true' || query.indexable === ''
  if (import.meta.dev) {
    if (!siteIndexable && _context.indexable === 'nuxt-simple-robots:config') {
      devHints.push('You are blocking indexing with your nuxt-simple-robots config.')
    }
    else if (queryIndexableEnabled && _context.indexable === 'computed-env') {
      siteIndexable = true
      devHints.push('You are mocking a production enviroment with ?indexable query.')
    }
    else if (!siteIndexable && !siteIndexable) {
      if (_context.indexable === 'computed-env')
        devHints.push(`Indexing is blocked because of the environment. You can mock a production environment with ?indexable query.`)
      else
        devHints.push(`Indexing is blocked by site config set by ${_context.indexable}.`)
    }
  }
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
  if (siteIndexable) {
    robotsTxtCtx = await resolveRobotsTxtContext('robots.txt')
    // normalise
    robotsTxtCtx.sitemaps = [...new Set(
      asArray(robotsTxtCtx.sitemaps)
        // validate sitemaps are absolute
        .map(s => !s.startsWith('http') ? withSiteUrl(e, s, { withBase: true, absolute: true }) : s),
    )]
  }
  let robotsTxt: string = generateRobotsTxt(robotsTxtCtx)
  if (import.meta.dev && devHints.length) {
    // append
    robotsTxt += `\n# DEVELOPMENT HINTS: ${devHints.join(', ')}\n`
  }
  if (credits) {
    robotsTxt = [
      `# START nuxt-simple-robots (${siteIndexable ? 'indexable' : 'indexing disabled'})`,
      robotsTxt,
      '# END nuxt-simple-robots',
    ].filter(Boolean).join('\n')
  }

  const hookCtx: HookRobotsTxtContext = { robotsTxt }
  await nitro.hooks.callHook('robots:robots-txt', hookCtx)
  return hookCtx.robotsTxt
})
