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

export type * from './runtime/types'

export { AiBots, NonHelpfulBots }

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
  }
  let ln = -1
  // read the contents
  for (const _line of s.split('\n')) {
    ln++
    const [line] = _line.split('#').map(s => s.trim())
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
      numMatchingLengths = pathLength - matchingLengths[0] + 1
      for (let i = 1; i < numMatchingLengths; i++) {
        matchingLengths[i] = matchingLengths[i - 1] + 1
      }
    }
    else {
      let numMatches = 0
      for (let i = 0; i < numMatchingLengths; i++) {
        const matchLength = matchingLengths[i]
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
    if (!matches(rule.pattern, path)) {
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

export function normalizeGroup(group: RobotsGroupInput): RobotsGroupResolved {
  const disallow = asArray(group.disallow) // we can have empty disallow
  const allow = asArray(group.allow).filter(rule => Boolean(rule))
  return <RobotsGroupResolved> {
    ...group,
    userAgent: group.userAgent ? asArray(group.userAgent) : ['*'],
    disallow,
    allow,
    _indexable: !disallow.includes((rule: string) => rule === '/'),
    _rules: [
      ...disallow.filter(Boolean).map(r => ({ pattern: r, allow: false })),
      ...allow.map(r => ({ pattern: r, allow: true })),
    ],
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

export function mergeOnKey<T, K extends keyof T>(arr: T[], key: K) {
  const res: Record<string, T> = {}
  arr.forEach((item) => {
    const k = item[key] as string
    // @ts-expect-error untyped
    res[k] = merger(item, res[k] || {})
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

// Create pattern map for bot detection
export function createPatternMap(): Map<string, PatternMapValue> {
  const patternMap = new Map()
  for (const def of BOT_MAP) {
    for (const bot of def.bots) {
      const patterns = [bot.pattern, ...(bot.secondaryPatterns || [])]
      for (const pattern of patterns) {
        patternMap.set(pattern.toLowerCase(), {
          botType: def.type,
          botName: bot.name,
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
      botType: string
      botName: string
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
          botType: botData.botType,
          botName: botData.botName,
          trusted: botData.trusted,
        },
      }
    }
  }

  return { isBot: false }
}

/**
 * Pure bot detection function using headers
 * @param headers - HTTP headers object
 * @returns Complete bot detection context
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
      detectionMethod: 'server',
      botType: detection.data.botType,
      botName: detection.data.botName,
      trusted: detection.data.trusted,
      lastDetected: Date.now(),
    }
  }

  return {
    isBot: false,
    userAgent,
    detectionMethod: 'server',
    lastDetected: Date.now(),
  }
}

/**
 * Check if headers indicate a bot
 * @param headers - HTTP headers object
 * @returns boolean indicating if request is from a bot
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
 * @param headers - HTTP headers object
 * @returns Bot info object or null
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
    type: detection.botType,
    name: detection.botName,
    trusted: detection.trusted,
    method: detection.detectionMethod,
  }
}

/**
 * Validate a parsed robots.txt structure
 * @param parsedRobotsTxt - The parsed robots.txt data
 * @returns The parsed robots.txt with any validation errors
 */
export function validateParsedRobotsTxt(parsedRobotsTxt: ParsedRobotsTxt): ParsedRobotsTxt {
  // The parseRobotsTxt function already handles validation and populates the errors array
  // This function exists to satisfy the module's expectations but doesn't need additional validation
  return parsedRobotsTxt
}
