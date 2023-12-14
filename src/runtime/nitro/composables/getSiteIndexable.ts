import type { H3Event } from 'h3'
import { useSiteConfig } from '#imports'

export function getSiteIndexable(e: H3Event) {
  // move towards deprecating indexable
  const { env, indexable } = useSiteConfig(e)
  // legacy
  if (typeof indexable !== 'undefined')
    return String(indexable) === 'true'

  return env === 'production'
}
