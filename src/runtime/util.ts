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

export function indexableFromGroup(groups: RobotsGroupInput[], path: string) {
  let indexable = true
  const wildCardGroups = groups.filter((group: any) => asArray(group.userAgent).includes('*'))
  for (const group of wildCardGroups) {
    const hasDisallowRule = asArray(group.disallow)
      // filter out empty rule
      .filter(rule => Boolean(rule))
      .some((rule: string) => path.startsWith(rule))
    const hasAllowRule = asArray(group.allow).some((rule: string) => path.startsWith(rule))
    if (hasDisallowRule && !hasAllowRule) {
      indexable = false
      break
    }
  }
  return indexable
}
