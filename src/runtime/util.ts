import type { RobotsGroupInput } from './types'

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
