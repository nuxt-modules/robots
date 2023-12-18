import type { H3Event } from 'h3'
import { getQuery } from 'h3'
import type { ParsedRobotsTxt } from '../../types'
import { useRuntimeConfig } from '#imports'
import { getSiteIndexable, useSiteConfig } from '#internal/nuxt-site-config'

export function getSiteRobotConfig(e: H3Event): { indexable: boolean, hints: string[] } {
// move towards deprecating indexable
  const query = getQuery(e)
  const hints: string[] = []
  const { groups, debug } = useRuntimeConfig(e)['nuxt-simple-robots']
  let indexable = getSiteIndexable(e)
  // get wildcard groups and which if they include an exclude for `/`
  if ((groups as ParsedRobotsTxt['groups']).some(g => g.userAgent.includes('*') && g.disallow.includes('/'))) {
    indexable = false
    hints.push('You have a disallow rule with `/` which blocks all routes.')
  }
  // allow previewing with ?mockProductionEnv
  const queryIndexableEnabled = String(query.mockProductionEnv) === 'true' || query.mockProductionEnv === ''
  if ((debug || import.meta.dev) && !indexable) {
    const { _context } = useSiteConfig(e, { debug: debug || import.meta.dev })
    if (queryIndexableEnabled && !_context.indexable) {
      indexable = true
      hints.push('You are mocking a production enviroment with ?mockProductionEnv query.')
    }
    else if (_context.indexable === 'nuxt-simple-robots:config') {
      hints.push('You are blocking indexing with your nuxt-simple-robots config.')
    }
    else if (!_context.indexable) {
      hints.push(`Indexing is blocked because of the environment. You can mock a production environment with ?mockProductionEnv query.`)
    }
    else {
      hints.push(`Indexing is blocked by site config set by ${_context.indexable}.`)
    }
  }
  return { indexable, hints }
}
