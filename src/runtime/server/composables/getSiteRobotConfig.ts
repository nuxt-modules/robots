import type { RequestEvent } from 'nuxt/server'
import type { ParsedRobotsTxt } from '../../types'
import { getQuery } from 'nuxt/server'
import { getSiteConfig, getSiteIndexable } from '#site-config/server'
import { useRuntimeConfigNuxtRobots } from './useRuntimeConfigNuxtRobots'

export function getSiteRobotConfig(e: RequestEvent): { indexable: boolean, hints: string[] } {
// move towards deprecating indexable
  const query = getQuery(e)
  const hints: string[] = []
  const { groups, debug } = useRuntimeConfigNuxtRobots(e)
  let indexable = getSiteIndexable(e)
  // allow previewing with ?mockProductionEnv
  const queryIndexableEnabled = String(query.mockProductionEnv) === 'true' || query.mockProductionEnv === ''
  if ((debug || import.meta.dev)) {
    const indexableSource = getSiteConfig(e, { debug: true })._context?.indexable
    if (queryIndexableEnabled) {
      indexable = true
      hints.push('You are mocking a production enviroment with ?mockProductionEnv query.')
    }
    else if (!indexable && indexableSource === 'nuxt-robots:config') {
      hints.push('You are blocking indexing with your Nuxt Robots config.')
    }
    else if (import.meta.dev && !queryIndexableEnabled && !indexableSource) {
      hints.push(`Indexing is blocked in development. You can mock a production environment with ?mockProductionEnv query.`)
    }
    else if (!indexable && !queryIndexableEnabled) {
      hints.push(indexableSource
        ? `Indexing is blocked by site config set by ${indexableSource}.`
        : 'Indexing is blocked by site config.')
    }
    else if (indexable && !queryIndexableEnabled) {
      hints.push(indexableSource
        ? `Indexing is enabled from ${indexableSource}.`
        : 'Indexing is enabled.')
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
