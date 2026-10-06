import type { RequestEvent } from 'nuxt/server'
import type { BotDetectionContext } from '../types'

// eslint-disable-next-line unused-imports/no-unused-vars
export function getPathRobotConfig(e: RequestEvent, options?: { skipSiteIndexable?: boolean, path?: string }) {
  return {
    indexable: true,
    rule: '',
  }
}

// eslint-disable-next-line unused-imports/no-unused-vars
export function getSiteRobotConfig(e: RequestEvent): { indexable: boolean, hints: string[] } {
  return {
    indexable: true,
    hints: [],
  }
}

// Mock bot detection functions when bot detection is disabled
// eslint-disable-next-line unused-imports/no-unused-vars
export function getBotDetection(e: RequestEvent): BotDetectionContext {
  return {
    isBot: false,
  }
}

// eslint-disable-next-line unused-imports/no-unused-vars
export function isBot(e: RequestEvent): boolean {
  return false
}

// eslint-disable-next-line unused-imports/no-unused-vars
export function getBotInfo(e: RequestEvent) {
  return null
}
