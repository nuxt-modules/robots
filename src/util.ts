import type { NitroRouteConfig } from 'nitropack/types'
import type { BotCategory, BotName } from './const-bots'
import type { BotDetectionContext, ParsedRobotsTxt, PatternMapValue, RobotsGroupInput, RobotsGroupResolved } from './runtime/types'
import { createDefu } from 'defu'
import { withoutLeadingSlash } from 'ufo'
import { AiBots, NonHelpfulBots } from './const'
import {
  AI_BOTS,
  AUTOMATION_BOTS,
  BOT_MAP,
  GENERIC_BOTS,
  HTTP_TOOL_BOTS,
  KNOWN_SEARCH_BOTS,
  SCRAPING_BOTS,
  SECURITY_SCANNING_BOTS,
  SEO_BOTS,
  SOCIAL_BOTS,
} from './const-bots'

export * from './const-bots'
export { AiBots, NonHelpfulBots }

/**
 * Predefined robot directive values map
 */
export const ROBOT_DIRECTIVE_VALUES = {
  // Standard directives
  enabled: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  disabled: 'noindex, nofollow',
  index: 'index',
  noindex: 'noindex',
  follow: 'follow',
  nofollow: 'nofollow',
  none: 'none',
  all: 'all',
  // Non-standard directives (not part of official robots spec)
  noai: 'noai',
  noimageai: 'noimageai',
} as const

export function formatMaxImagePreview(value: 'none' | 'standard' | 'large'): string {
  return `max-image-preview:${value}`
}

export function formatMaxSnippet(value: number): string {
  return `max-snippet:${value}`
}

export function formatMaxVideoPreview(value: number): string {
  return `max-video-preview:${value}`
}

/**
 * We're going to read the robots.txt and extract any disallow or sitemaps rules from it.
 *
 * We're going to use the Google specification, the keys should be checked:
 *
 * - user-agent: identifies which crawler the rules apply to.
 * - allow: a URL path that may be crawled.
 * - disallow: a URL path that may not be crawled.
 * - sitemap: the complete URL of a sitemap.
 * - host: the host name of the site, this is optional non-standard directive.
 * - content-usage / content-signal: AI content usage preferences (IETF spec / Cloudflare implementation).
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt
 * @see https://github.com/google/robotstxt/blob/86d5836ba2d5a0b6b938ab49501be0e09d9c276c/robots.cc#L714C1-L720C2
 */
export function parseRobotsTxt(s: string): ParsedRobotsTxt {
  // then we'll extract the disallow and sitemap rules
  const groups: RobotsGroupResolved[] = []
  const sitemaps: string[] = []
  const errors: string[] = []
  let createNewGroup = false
  let currentGroup: RobotsGroupResolved = {
    comment: [], // comments are too hard to parse in a logical order, we'll just omit them
    disallow: [],
    allow: [],
    userAgent: [],
    contentUsage: [],
    contentSignal: [],
  }
  let ln = -1
  // read the contents
  for (const _line of s.split('\n')) {
    ln++
    const [preComment] = _line.split('#').map(s => s.trim())
    const line = String(preComment)
    const sepIndex = line.indexOf(':')
    // may not exist for comments
    if (sepIndex === -1)
      continue
    // get the rule, pop before the first :
    const rule = line.substring(0, sepIndex).trim().toLowerCase()
    const val = line.substring(sepIndex + 1).trim()

    switch (rule) {
      case 'user-agent':
      case 'useragent':
      case 'user agent':
        if (createNewGroup) {
          groups.push({
            ...currentGroup,
          })
          currentGroup = <RobotsGroupResolved> {
            comment: [],
            disallow: [],
            allow: [],
            userAgent: [],
            contentUsage: [],
            contentSignal: [],
          }
          createNewGroup = false
        }
        currentGroup.userAgent.push(val)
        break
      case 'allow':
        currentGroup.allow.push(val)
        createNewGroup = true
        break
      case 'disallow':
      case 'dissallow':
      case 'dissalow':
      case 'disalow':
      case 'diasllow':
      case 'disallaw':
        currentGroup.disallow.push(val)
        createNewGroup = true
        break
      case 'sitemap':
      case 'site-map':
        sitemaps.push(val)
        break
      case 'host':
        currentGroup.host = val
        break
      case 'clean-param':
        if (currentGroup.userAgent.some(u => u.toLowerCase().includes('yandex'))) {
          currentGroup.cleanParam = currentGroup.cleanParam || []
          currentGroup.cleanParam.push(val)
        }
        else {
          errors.push(`L${ln}: Clean-param directive is only when targeting Yandex user agent.`)
        }
        break
      case 'content-usage':
        currentGroup.contentUsage = currentGroup.contentUsage || []
        currentGroup.contentUsage.push(val)
        break
      case 'content-signal':
        currentGroup.contentSignal = currentGroup.contentSignal || []
        currentGroup.contentSignal.push(val)
        break
      default:
        errors.push(`L${ln}: Unknown directive ${rule} `)
        break
    }
  }
  // push final stack
  groups.push({
    ...currentGroup,
  })
  return {
    groups,
    sitemaps,
    errors,
  }
}

function validateGroupRules(group: ParsedRobotsTxt['groups'][number], errors: string[]) {
  const toCheck = ['allow', 'disallow']
  toCheck.forEach((key) => {
    (group[key as keyof typeof group] as string[] || []).filter((rule) => {
      if (rule === '')
        return true
      if (!rule.startsWith('/') && !rule.startsWith('*')) {
        errors.push(`Disallow rule "${rule}" must start with a \`/\` or be a \`*\`.`)
        return false
      }
      // TODO other rules?
      return true
    })
  })

  // Validate Content-Usage directives
  if (group.contentUsage) {
    const validCategories = ['bots', 'train-ai', 'ai-output', 'search']
    const validValues = ['y', 'n']

    group.contentUsage.forEach((rule) => {
      if (rule === '') {
        errors.push(`Content-Usage rule cannot be empty.`)
        return
      }

      // Format can be: "preference" or "/path preference"
      const parts = rule.trim().split(/\s+/)

      if (parts.length === 1) {
        // Global preference like "bots=y" or "train-ai=n"
        if (!parts[0]?.includes('=')) {
          errors.push(`Content-Usage rule "${rule}" must contain a preference assignment (e.g., "train-ai=n").`)
          return
        }

        // Validate category and value
        const preferences = parts[0].split(',').map(p => p.trim())
        preferences.forEach((pref) => {
          const [category, value] = pref.split('=').map(s => s.trim())
          if (!validCategories.includes(category || '')) {
            errors.push(`Content-Usage category "${category}" is invalid. Valid categories: ${validCategories.join(', ')}.`)
          }
          if (!validValues.includes(value || '')) {
            errors.push(`Content-Usage value "${value}" for "${category}" is invalid. Valid values: y, n.`)
          }
        })
      }
      else if (parts.length >= 2) {
        // Path-specific preference like "/path train-ai=n"
        const path = parts[0]
        const preference = parts.slice(1).join(' ')

        if (!path?.startsWith('/')) {
          errors.push(`Content-Usage path "${path}" must start with a \`/\`.`)
        }
        if (!preference.includes('=')) {
          errors.push(`Content-Usage preference "${preference}" must contain an assignment (e.g., "train-ai=n").`)
        }
        else {
          // Validate category and value in path-specific rules
          const preferences = preference.split(',').map(p => p.trim())
          preferences.forEach((pref) => {
            const [category, value] = pref.split('=').map(s => s.trim())
            if (!validCategories.includes(category || '')) {
              errors.push(`Content-Usage category "${category}" is invalid. Valid categories: ${validCategories.join(', ')}.`)
            }
            if (!validValues.includes(value || '')) {
              errors.push(`Content-Usage value "${value}" for "${category}" is invalid. Valid values: y, n.`)
            }
          })
        }
      }
    })
  }

  // Validate Content-Signal directives
  if (group.contentSignal) {
    const validCategories = ['search', 'ai-input', 'ai-train']
    const validValues = ['yes', 'no']

    group.contentSignal.forEach((rule) => {
      if (rule === '') {
        errors.push(`Content-Signal rule cannot be empty.`)
        return
      }

      // Format can be: "preference" or "/path preference"
      const parts = rule.trim().split(/\s+/)

      if (parts.length === 1) {
        // Global preference like "ai-train=no" or "search=yes"
        if (!parts[0]?.includes('=')) {
          errors.push(`Content-Signal rule "${rule}" must contain a preference assignment (e.g., "ai-train=no").`)
          return
        }

        // Validate category and value
        const preferences = parts[0].split(',').map(p => p.trim())
        preferences.forEach((pref) => {
          const [category, value] = pref.split('=').map(s => s.trim())
          if (!validCategories.includes(category || '')) {
            errors.push(`Content-Signal category "${category}" is invalid. Valid categories: ${validCategories.join(', ')}.`)
          }
          if (!validValues.includes(value || '')) {
            errors.push(`Content-Signal value "${value}" for "${category}" is invalid. Valid values: yes, no.`)
          }
        })
      }
      else if (parts.length >= 2) {
        // Path-specific preference like "/path ai-train=no"
        const path = parts[0]
        const preference = parts.slice(1).join(' ')

        if (!path?.startsWith('/')) {
          errors.push(`Content-Signal path "${path}" must start with a \`/\`.`)
        }
        if (!preference.includes('=')) {
          errors.push(`Content-Signal preference "${preference}" must contain an assignment (e.g., "ai-train=no").`)
        }
        else {
          // Validate category and value in path-specific rules
          const preferences = preference.split(',').map(p => p.trim())
          preferences.forEach((pref) => {
            const [category, value] = pref.split('=').map(s => s.trim())
            if (!validCategories.includes(category || '')) {
              errors.push(`Content-Signal category "${category}" is invalid. Valid categories: ${validCategories.join(', ')}.`)
            }
            if (!validValues.includes(value || '')) {
              errors.push(`Content-Signal value "${value}" for "${category}" is invalid. Valid values: yes, no.`)
            }
          })
        }
      }
    })
  }
}

function matches(pattern: string, path: string): boolean {
  const pathLength = path.length
  const patternLength = pattern.length
  const matchingLengths: number[] = Array.from({ length: pathLength + 1 }).fill(0) as number[]
  let numMatchingLengths = 1

  let p = 0
  while (p < patternLength) {
    if (pattern[p] === '$' && p + 1 === patternLength) {
      return matchingLengths[numMatchingLengths - 1] === pathLength
    }

    if (pattern[p] === '*') {
      // @ts-expect-error untyped
      numMatchingLengths = pathLength - matchingLengths[0] + 1
      for (let i = 1; i < numMatchingLengths; i++) {
        // @ts-expect-error untyped
        matchingLengths[i] = matchingLengths[i - 1] + 1
      }
    }
    else {
      let numMatches = 0
      for (let i = 0; i < numMatchingLengths; i++) {
        const matchLength = matchingLengths[i] as number
        if (matchLength < pathLength && path[matchLength] === pattern[p]) {
          matchingLengths[numMatches++] = matchLength + 1
        }
      }
      if (numMatches === 0) {
        return false
      }
      numMatchingLengths = numMatches
    }
    p++
  }

  return true
}
export function matchPathToRule(path: string, _rules: Required<RobotsGroupResolved>['_rules']): Required<RobotsGroupResolved>['_rules'][number] | null {
  let matchedRule: Required<RobotsGroupResolved>['_rules'][number] | null = null

  const rules = _rules.filter(Boolean) // filter out empty line such as Disallow:
  const rulesLength = rules.length
  let i = 0
  while (i < rulesLength) {
    const rule = rules[i]
    if (!rule || !matches(rule.pattern, path)) {
      i++
      continue
    }

    if (!matchedRule || rule.pattern.length > matchedRule.pattern.length) {
      matchedRule = rule
    }
    else if (
      rule.pattern.length === matchedRule.pattern.length
      && rule.allow
      && !matchedRule.allow
    ) {
      matchedRule = rule
    }
    i++
  }

  return matchedRule
}

export function validateRobots(robotsTxt: ParsedRobotsTxt) {
  // 1. check that the include / exclude is either empty or starts with a slash OR a wildcard
  robotsTxt.groups = robotsTxt.groups.filter((group) => {
    if (!group.allow.length && !group.disallow.length) {
      robotsTxt.errors.push(`Group "${group.userAgent.join(', ')}" has no allow or disallow rules. You must provide one of either.`)
      return false
    }
    validateGroupRules(group, robotsTxt.errors)
    return true
  })
  return robotsTxt
}

export function asArray(v: any) {
  return typeof v === 'undefined' ? [] : (Array.isArray(v) ? v : [v])
}

/**
 * Convert ContentUsagePreferences object to string format
 */
function contentUsageToString(prefs: Record<string, string>): string {
  return Object.entries(prefs)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ')
}

/**
 * Normalize contentUsage/contentSignal to string array format
 */
function normalizeContentPreferences(value: any): string[] {
  if (!value)
    return []

  // If it's already an array of strings, filter and return
  if (Array.isArray(value))
    return value.filter(rule => Boolean(rule))

  // If it's an object (ContentUsagePreferences or ContentSignalPreferences)
  if (typeof value === 'object' && !Array.isArray(value)) {
    const str = contentUsageToString(value)
    return str ? [str] : []
  }

  // If it's a single string
  if (typeof value === 'string')
    return value ? [value] : []

  return []
}

export function normalizeGroup(group: RobotsGroupInput | RobotsGroupResolved): RobotsGroupResolved {
  // quick renormalization check
  if ((group as RobotsGroupResolved)._normalized) {
    const resolvedGroup = group as RobotsGroupResolved
    const disallow = asArray(resolvedGroup.disallow) // we can have empty disallow
    resolvedGroup._indexable = !disallow.includes('/')
    resolvedGroup._rules = [
      ...resolvedGroup.disallow.filter(Boolean).map(r => ({ pattern: r, allow: false })),
      ...resolvedGroup.allow.map(r => ({ pattern: r, allow: true })),
    ]
    return resolvedGroup
  }
  const disallow = asArray(group.disallow) // we can have empty disallow
  const allow = asArray(group.allow).filter(rule => Boolean(rule))
  const contentUsage = normalizeContentPreferences(group.contentUsage)
  const contentSignal = normalizeContentPreferences(group.contentSignal)
  return <RobotsGroupResolved> {
    ...group,
    userAgent: group.userAgent ? asArray(group.userAgent) : ['*'],
    disallow,
    allow,
    contentUsage,
    contentSignal,
    _indexable: !disallow.includes('/'),
    _rules: [
      ...disallow.filter(Boolean).map(r => ({ pattern: r, allow: false })),
      ...allow.map(r => ({ pattern: r, allow: true })),
    ],
    _normalized: true,
  }
}

export function generateRobotsTxt({ groups, sitemaps }: { groups: RobotsGroupResolved[], sitemaps: string[] }): string {
  // iterate over the groups
  const lines: string[] = []
  for (const group of groups) {
    // add the comments
    for (const comment of group.comment || [])
      lines.push(`# ${comment}`)
    // add the user agent
    for (const userAgent of group.userAgent || ['*'])
      lines.push(`User-agent: ${userAgent}`)

    // add the allow rules
    for (const allow of group.allow || [])
      lines.push(`Allow: ${allow}`)

    // add the disallow rules
    for (const disallow of group.disallow || [])
      lines.push(`Disallow: ${disallow}`)

    // yandex only (see https://yandex.com/support/webmaster/robot-workings/clean-param.html)
    for (const cleanParam of group.cleanParam || [])
      lines.push(`Clean-param: ${cleanParam}`)

    // AI preferences - IETF aipref-vocab
    // See: https://datatracker.ietf.org/doc/draft-ietf-aipref-attach/
    for (const contentUsage of group.contentUsage || [])
      lines.push(`Content-Usage: ${contentUsage}`)

    // AI preferences - IETF aipref-contentsignals
    // See: https://www.ietf.org/archive/id/draft-romm-aipref-contentsignals-00.html
    for (const contentSignal of group.contentSignal || [])
      lines.push(`Content-Signal: ${contentSignal}`)

    lines.push('') // seperator
  }
  // add sitemaps
  for (const sitemap of sitemaps)
    lines.push(`Sitemap: ${sitemap}`)

  return lines.join('\n')
}

const merger = createDefu((obj, key, value) => {
  // merge arrays using a set
  if (Array.isArray(obj[key]) && Array.isArray(value))
    // @ts-expect-error untyped
    obj[key] = Array.from(new Set([...obj[key], ...value]))
  return obj[key]
})

export function mergeOnKey<T extends Record<string, any>, K extends keyof T>(arr: T[], key: K) {
  const res: Record<string, T> = {}
  arr.forEach((item) => {
    const k = item[key] as string
    res[k] = merger(res[k] || {}, item) as T
  })
  return Object.values(res)
}

export function isInternalRoute(_path: string) {
  const path = withoutLeadingSlash(_path)
  // exclude things like cgi-bin, .well-known, etc.
  if (path.startsWith('.') || path.startsWith('_'))
    return true
  if (path.startsWith('cgi-bin') || path.startsWith('cdn-cgi') || path.startsWith('api'))
    return true
  const lastSegment = path.split('/').pop() || path
  return lastSegment.includes('.') || path.startsWith('@')
}

export {
  AI_BOTS,
  AUTOMATION_BOTS,
  GENERIC_BOTS,
  HTTP_TOOL_BOTS,
  KNOWN_SEARCH_BOTS,
  SCRAPING_BOTS,
  SECURITY_SCANNING_BOTS,
  SEO_BOTS,
  SOCIAL_BOTS,
}

export type * from './runtime/types'

// Create pattern map for bot detection
export function createPatternMap(): Map<string, PatternMapValue> {
  const patternMap = new Map()
  for (const def of BOT_MAP) {
    for (const bot of def.bots) {
      const patterns = [bot.pattern, ...(bot.secondaryPatterns || [])]
      for (const pattern of patterns) {
        patternMap.set(pattern.toLowerCase(), {
          botName: bot.name as BotName,
          botCategory: def.type,
          trusted: def.trusted,
        })
      }
    }
  }
  return patternMap
}

/**
 * Detects bots based on HTTP headers analysis
 * @param headers - HTTP headers object (similar to h3's getHeaders result)
 * @param patternMap - Optional precomputed pattern map for performance optimization
 * @returns Bot detection result with type, name, and trust level
 */
export function isBotFromHeaders(
  headers: Record<string, string | string[] | undefined>,
  patternMap?: Map<string, PatternMapValue>,
): {
  isBot: boolean
  data?: {
    botName: BotName
    botCategory: BotCategory
    trusted: boolean
  }
} {
  const userAgent = Array.isArray(headers['user-agent']) ? headers['user-agent'][0] : headers['user-agent']

  // Only detect known bots, not suspicious patterns
  if (!userAgent) {
    return { isBot: false }
  }

  const userAgentLower = userAgent.toLowerCase()

  // Use provided pattern map or create on demand for standalone usage
  const resolvedPatternMap = patternMap || createPatternMap()

  // Use optimized pattern lookup - O(n) instead of O(n³)
  for (const [pattern, botData] of resolvedPatternMap) {
    if (userAgentLower.includes(pattern)) {
      return {
        isBot: true,
        data: {
          botName: botData.botName,
          botCategory: botData.botCategory,
          trusted: botData.trusted,
        },
      }
    }
  }

  return { isBot: false }
}

/**
 * Pure bot detection function using headers
 */
export function getBotDetection(
  headers: Record<string, string | string[] | undefined>,
  patternMap?: Map<string, PatternMapValue>,
): BotDetectionContext {
  const userAgent = Array.isArray(headers['user-agent']) ? headers['user-agent'][0] : headers['user-agent']
  const detection = isBotFromHeaders(headers, patternMap)

  if (detection.isBot && detection.data) {
    return {
      isBot: true,
      userAgent,
      detectionMethod: 'headers',
      botName: detection.data.botName,
      botCategory: detection.data.botCategory,
      trusted: detection.data.trusted,
    }
  }

  return {
    isBot: false,
    userAgent,
  }
}

/**
 * Check if headers indicate a bot
 */
export function isBot(
  headers: Record<string, string | string[] | undefined>,
  patternMap?: Map<string, PatternMapValue>,
): boolean {
  const detection = getBotDetection(headers, patternMap)
  return detection.isBot
}

/**
 * Get bot information if detected
 */
export function getBotInfo(
  headers: Record<string, string | string[] | undefined>,
  patternMap?: Map<string, PatternMapValue>,
) {
  const detection = getBotDetection(headers, patternMap)

  if (!detection.isBot) {
    return null
  }

  return {
    name: detection.botName,
    category: detection.botCategory,
    trusted: detection.trusted,
    method: detection.detectionMethod,
  }
}

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
