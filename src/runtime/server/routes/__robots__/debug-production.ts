import { parseRobotsTxt, validateRobots } from '@nuxtjs/robots/util'
import { defineEventHandler, getQuery } from 'h3'

export interface ProductionDebugResponse {
  url: string
  robotsTxt: string
  indexable: boolean
  hints: string[]
  validation: {
    errors: string[]
    warnings: string[]
    groups: number
    sitemaps: string[]
  }
  hasRemoteDebug: boolean
  error?: string
}

export default defineEventHandler(async (e): Promise<ProductionDebugResponse> => {
  const { url, mode } = getQuery(e) as { url?: string, mode?: string }
  if (!url || typeof url !== 'string')
    return { url: '', robotsTxt: '', indexable: false, hints: [], validation: { errors: [], warnings: [], groups: 0, sitemaps: [] }, hasRemoteDebug: false, error: 'Missing url query parameter' }

  const baseUrl = url.replace(/\/$/, '')

  // Try fetching the full debug endpoint from production (requires debug: true)
  if (mode === 'debug') {
    const debugUrl = `${baseUrl}/__robots__/debug.json`
    const response = await fetch(debugUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    }).catch(() => null)
    if (response?.ok) {
      const json = await response.json().catch(() => null)
      if (json?.robotsTxt) {
        return {
          ...json,
          url: baseUrl,
          hasRemoteDebug: true,
        }
      }
    }
    // Fall through to robots.txt fetch
  }

  // Fetch and validate the production robots.txt directly (always public)
  const robotsUrl = `${baseUrl}/robots.txt`
  const response = await fetch(robotsUrl, {
    headers: { Accept: 'text/plain' },
    signal: AbortSignal.timeout(15000),
  }).catch((err: Error) => err)

  if (response instanceof Error)
    return { url: baseUrl, robotsTxt: '', indexable: false, hints: [], validation: { errors: [], warnings: [], groups: 0, sitemaps: [] }, hasRemoteDebug: false, error: `Failed to fetch robots.txt: ${response.message}` }

  if (!response.ok)
    return { url: baseUrl, robotsTxt: '', indexable: false, hints: [], validation: { errors: [], warnings: [], groups: 0, sitemaps: [] }, hasRemoteDebug: false, error: `HTTP ${response.status}: ${response.statusText}` }

  const robotsTxt = await response.text()
  const parsed = validateRobots(parseRobotsTxt(robotsTxt))

  // Check if any group disallows all paths for all user agents
  const hasBlockAll = parsed.groups.some(g =>
    g.userAgent.includes('*') && g.disallow.includes('/'),
  )

  return {
    url: baseUrl,
    robotsTxt,
    indexable: !hasBlockAll,
    hints: hasBlockAll ? ['robots.txt blocks all crawlers with Disallow: /'] : [],
    validation: {
      errors: parsed.errors,
      warnings: parsed.warnings,
      groups: parsed.groups.length,
      sitemaps: parsed.sitemaps,
    },
    hasRemoteDebug: false,
  }
})
