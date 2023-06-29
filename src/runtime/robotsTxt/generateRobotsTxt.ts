import type { RobotsGroupResolved } from '../../types'

export function generateRobotsTxt({ groups, sitemaps }: { groups: RobotsGroupResolved[]; sitemaps: string[] }): string {
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

    lines.push('') // seperator
  }
  // add sitemaps
  for (const sitemap of sitemaps)
    lines.push(`Sitemap: ${sitemap}`)

  return lines.join('\n')
}
