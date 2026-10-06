import type { RequestEvent } from 'nuxt/server'
import { getBotDetection as getBotDetectionFromHeaders, getBotInfo as getBotInfoFromHeaders, isBot as isBotFromHeaders } from '@nuxtjs/robots/util'
import { getRequestHeaders } from 'nuxt/server'
import { useNitroApp } from '#nuxtseo/nitro'

// Re-export the interface from util
export type { BotDetectionContext } from '@nuxtjs/robots/util'

function resolveBotDetectionInput(event: RequestEvent) {
  const headers = getRequestHeaders(event) || {}
  const nitroApp = useNitroApp()
  return { headers, patternMap: nitroApp._robotsPatternMap }
}

/**
 * Server-side bot detection using request headers
 * @param event H3 event object
 * @returns Bot detection context
 */
export function getBotDetection(event: RequestEvent) {
  const { headers, patternMap } = resolveBotDetectionInput(event)
  return getBotDetectionFromHeaders(headers, patternMap)
}

/**
 * Check if the current request is from a bot
 * @param event H3 event object
 * @returns boolean indicating if request is from a bot
 */
export function isBot(event: RequestEvent): boolean {
  const { headers, patternMap } = resolveBotDetectionInput(event)
  return isBotFromHeaders(headers, patternMap)
}

/**
 * Get bot information if detected
 * @param event H3 event object
 * @returns Bot info object or null
 */
export function getBotInfo(event: RequestEvent) {
  const { headers, patternMap } = resolveBotDetectionInput(event)
  return getBotInfoFromHeaders(headers, patternMap)
}
