import type { H3Event } from 'h3'

// eslint-disable-next-line unused-imports/no-unused-vars
export function getPathRobotConfig(e: H3Event, options?: { skipSiteIndexable?: boolean, path?: string }) {
  return {
    indexable: true,
    rule: '',
  }
}

// eslint-disable-next-line unused-imports/no-unused-vars
export function getSiteRobotConfig(e: H3Event): { indexable: boolean, hints: string[] } {
  return {
    indexable: true,
    hints: [],
  }
}
