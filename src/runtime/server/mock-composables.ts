import type { H3Event } from 'h3'
import type { BotDetectionContext } from '../types'

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

// Mock bot detection functions when bot detection is disabled
// eslint-disable-next-line unused-imports/no-unused-vars
export function getBotDetection(e: H3Event): BotDetectionContext {
  return {
    isBot: false,
  }
}

// eslint-disable-next-line unused-imports/no-unused-vars
export function isBot(e: H3Event): boolean {
  return false
}

// eslint-disable-next-line unused-imports/no-unused-vars
export function getBotInfo(e: H3Event) {
  return null
}
