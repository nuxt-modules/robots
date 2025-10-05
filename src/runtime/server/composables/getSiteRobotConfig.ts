import type { H3Event } from 'h3'
import type { ParsedRobotsTxt } from '../../types'
import { getSiteConfig } from '#site-config/server/composables'
import { getSiteIndexable } from '#site-config/server/composables/getSiteIndexable'
import { getQuery } from 'h3'
import { useRuntimeConfigNuxtRobots } from './useRuntimeConfigNuxtRobots'

export function getSiteRobotConfig(e: H3Event): { indexable: boolean, hints: string[] } {
// move towards deprecating indexable
  const query = getQuery(e)
  const hints: string[] = []
  const { groups, debug } = useRuntimeConfigNuxtRobots(e)
  let indexable = getSiteIndexable(e)
  // allow previewing with ?mockProductionEnv
  const queryIndexableEnabled = String(query.mockProductionEnv) === 'true' || query.mockProductionEnv === ''
  if ((debug || import.meta.dev)) {
    const { _context } = getSiteConfig(e, { debug: debug || import.meta.dev })
    if (queryIndexableEnabled) {
      indexable = true
      hints.push('You are mocking a production enviroment with ?mockProductionEnv query.')
    }
    else if (!indexable && _context.indexable === 'nuxt-robots:config') {
      hints.push('You are blocking indexing with your Nuxt Robots config.')
    }
    else if (!queryIndexableEnabled && (!_context.indexable)) {
      hints.push(`Indexing is blocked in development. You can mock a production environment with ?mockProductionEnv query.`)
    }
    else if (!indexable && !queryIndexableEnabled) {
      hints.push(`Indexing is blocked by site config set by ${_context.indexable}.`)
    }
    else if (indexable && !queryIndexableEnabled) {
      hints.push(`Indexing is enabled from ${_context.indexable}.`)
    }
  }
  // get wildcard groups and which if they include an exclude for `/`
  if ((groups as ParsedRobotsTxt['groups']).some(g => g.userAgent.includes('*') && g.disallow.includes('/'))) {
    indexable = false
    hints.push('You are blocking all user agents with a wildcard `Disallow /`.')
  }
  else if ((groups as ParsedRobotsTxt['groups']).some(g => g.disallow.includes('/'))) {
    hints.push('You are blocking specific user agents with `Disallow /`.')
  }
  return { indexable, hints }
}
