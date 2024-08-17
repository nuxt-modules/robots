import { createDefu } from 'defu'
import type { NitroRouteConfig } from 'nitropack'
import { withoutLeadingSlash } from 'ufo'
import type { ParsedRobotsTxt, RobotsGroupInput, RobotsGroupResolved } from './types'

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
 */
export function parseRobotsTxt(s: string): ParsedRobotsTxt {
  // then we'll extract the disallow and sitemap rules
  const groups: RobotsGroupResolved[] = []
  const sitemaps: string[] = []
  let createNewGroup = false
  let currentGroup: RobotsGroupResolved = {
    comment: [], // comments are too hard to parse in a logical order, we'll just omit them
    disallow: [],
    allow: [],
    userAgent: [],
  }
  // read the contents
  for (const line of s.split('\n')) {
    const sepIndex = line.indexOf(':')
    // may not exist for comments
    if (sepIndex === -1)
      continue
    // get the rule, pop before the first :
    const rule = line.substring(0, sepIndex).trim()
    const val = line.substring(sepIndex + 1).trim()

    switch (rule) {
      case 'User-agent':
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
      case 'Allow':
        currentGroup.allow.push(val)
        createNewGroup = true
        break
      case 'Disallow':
        currentGroup.disallow.push(val)
        createNewGroup = true
        break
      case 'Sitemap':
        sitemaps.push(val)
        break
      case 'Host':
        currentGroup.host = val
        break
      case 'Clean-param':
        if (currentGroup.userAgent.includes('Yandex')) {
          currentGroup.cleanParam = currentGroup.cleanParam || []
          currentGroup.cleanParam.push(val)
        }
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
  const matchingLengths: number[] = Array.from({ length: pathLength + 1 }).fill(0)
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
export function matchPathToRule(path: string, rules: RobotsGroupResolved['_rules']): RobotsGroupResolved['_rules'][number] | null {
  let matchedRule: RobotsGroupResolved['_rules'][number] | null = null

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
  const errors: string[] = []
  // 1. check that the include / exclude is either empty or starts with a slash OR a wildcard
  robotsTxt.groups = robotsTxt.groups.filter((group) => {
    if (!group.allow.length && !group.disallow.length) {
      errors.push(`Group "${group.userAgent.join(', ')}" has no allow or disallow rules. You must provide one of either.`)
      return false
    }
    validateGroupRules(group, errors)
    return true
  })
  return errors
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
    _indexable: disallow.includes((rule: string) => rule === '/'),
    _rules: [
      ...disallow.map(r => ({ pattern: r, allow: false })),
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

export function normaliseRobotsRouteRule(config: NitroRouteConfig) {
  // parse allow
  let allow: boolean | undefined
  if (typeof config.robots === 'boolean')
    allow = config.robots
  else if (typeof config.robots === 'object' && typeof config.robots.indexable !== 'undefined')
    allow = config.robots.indexable
  else if (typeof config.index !== 'undefined')
    allow = config.index
  // parse rule
  let rule: string | undefined
  if (typeof config.robots === 'object' && typeof config.robots.rule !== 'undefined')
    rule = config.robots.rule
  else if (typeof config.robots === 'string')
    rule = config.robots
  if (rule && !allow)
    allow = rule !== 'none' && !rule.includes('noindex')
  if (typeof allow === 'undefined' && typeof rule === 'undefined')
    return
  return {
    allow,
    rule,
  }
}
