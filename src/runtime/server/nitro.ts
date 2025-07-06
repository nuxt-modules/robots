import type { NitroRouteConfig } from 'nitropack/types'
import { formatMaxImagePreview, formatMaxSnippet, formatMaxVideoPreview, ROBOT_DIRECTIVE_VALUES } from '../const'

export function normaliseRobotsRouteRule(config: NitroRouteConfig) {
  // parse allow
  let allow: boolean | undefined
  if (typeof config.robots === 'boolean')
    allow = config.robots
  else if (typeof config.robots === 'object' && 'indexable' in config.robots && typeof config.robots.indexable !== 'undefined')
    allow = config.robots.indexable
  // parse rule
  let rule: string | undefined
  if (typeof config.robots === 'object' && config.robots !== null) {
    // Check if it has a rule property (old format)
    if ('rule' in config.robots && typeof config.robots.rule !== 'undefined') {
      rule = config.robots.rule
    }
    // Check if it's using the new directive format
    else if (!('indexable' in config.robots)) {
      const directives: string[] = []
      for (const [key, value] of Object.entries(config.robots)) {
        if (value === false || value === null || value === undefined)
          continue

        // Handle boolean directives
        if (key in ROBOT_DIRECTIVE_VALUES && typeof value === 'boolean' && value) {
          directives.push(ROBOT_DIRECTIVE_VALUES[key as keyof typeof ROBOT_DIRECTIVE_VALUES])
        }
        // Handle max-image-preview
        else if (key === 'max-image-preview' && typeof value === 'string') {
          directives.push(formatMaxImagePreview(value as 'none' | 'standard' | 'large'))
        }
        // Handle max-snippet
        else if (key === 'max-snippet' && typeof value === 'number') {
          directives.push(formatMaxSnippet(value))
        }
        // Handle max-video-preview
        else if (key === 'max-video-preview' && typeof value === 'number') {
          directives.push(formatMaxVideoPreview(value))
        }
      }
      if (directives.length > 0) {
        rule = directives.join(', ')
      }
    }
  }
  else if (typeof config.robots === 'string') {
    rule = config.robots
  }
  if (rule && typeof allow === 'undefined') {
    // Check if any of the directives indicate disallow
    const disallowIndicators = ['none', 'noindex', 'noai', 'noimageai']
    allow = !disallowIndicators.some(indicator =>
      rule === indicator || rule.split(',').some(part => part.trim() === indicator),
    )
  }
  if (typeof allow === 'undefined' && typeof rule === 'undefined')
    return
  return {
    allow,
    rule,
  }
}
