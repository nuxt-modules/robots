import { defineEventHandler, getQuery, setHeader } from 'h3'
import { generateRobotsTxt } from '../../util'
import { resolveRobotsTxtContext } from '../util'
import type { HookRobotsTxtContext } from '../../types'
import { useNitroApp, useRuntimeConfig, useSiteConfig } from '#imports'

export default defineEventHandler(async (e) => {
  const nitro = useNitroApp()
  const query = getQuery(e)
  setHeader(e, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(e, 'Cache-Control', import.meta.dev ? 'no-store' : 'max-age=14400, must-revalidate')

  const { credits } = useRuntimeConfig()['nuxt-simple-robots']
  const { indexable: _indexable, _context } = useSiteConfig(e, { debug: import.meta.dev })
  let indexable = Boolean(_indexable)
  // allow previewing with ?indexable
  const queryIndexableEnabled = String(query.indexable) === 'true' || query.indexable === ''
  const devHints: string[] = []
  if (import.meta.dev) {
    if (!indexable && _context.indexable === 'nuxt-simple-robots:config') {
      devHints.push('You are blocking indexing with your nuxt-simple-robots config.')
    }
    else if (queryIndexableEnabled && _context.indexable === 'computed-env') {
      indexable = true
      devHints.push('You are mocking a production enviroment with ?indexable query.')
    }
    else if (!indexable && !indexable) {
      if (_context.indexable === 'computed-env')
        devHints.push(`Indexing is blocked because of the environment. You can mock a production environment with ?indexable query.`)
      else
        devHints.push(`Indexing is blocked by site config set by ${_context.indexable}.`)
    }
  }
  const robotsTxtCtx = await resolveRobotsTxtContext(e, indexable, 'robots.txt')
  let robotsTxt: string = generateRobotsTxt(robotsTxtCtx)
  if (import.meta.dev && devHints.length) {
    // append
    robotsTxt += `\n# DEVELOPMENT HINTS: ${devHints.join(', ')}\n`
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
