import type { ParsedRobotsTxt, RobotsGroupInput } from '../types'
import { asArray, normalizeGroup } from '../../util'

/**
 * Pure normalization function for robots context
 * - Groups are normalized with _indexable and _rules
 * - Sitemaps are converted to array, deduplicated, and filtered for valid strings
 * - Errors are converted to array and filtered for valid strings
 *
 * Note: URL absolutization (withSiteUrl) happens separately in robots-txt.ts since it requires H3Event
 */
export function normalizeRobotsContext(input: Partial<ParsedRobotsTxt>): ParsedRobotsTxt {
  return {
    groups: asArray(input.groups).map(g => normalizeGroup(g as RobotsGroupInput)),
    sitemaps: [...new Set(
      asArray(input.sitemaps)
        .filter(s => typeof s === 'string' && s.trim().length > 0),
    )],
    errors: asArray(input.errors)
      .filter(e => typeof e === 'string' && e.trim().length > 0),
  }
}
