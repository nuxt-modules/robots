import type { H3Event } from 'h3'
import { getBotDetection as getBotDetectionFromHeaders, getBotInfo as getBotInfoFromHeaders, isBot as isBotFromHeaders } from '@nuxtjs/robots/util'
import { getHeaders } from 'h3'
import { useNitroApp } from 'nitropack/runtime'

// Re-export the interface from util
export type { BotDetectionContext } from '@nuxtjs/robots/util'

function resolveBotDetectionInput(event: H3Event) {
  const headers = getHeaders(event) || {}
  const nitroApp = useNitroApp()
  return { headers, patternMap: nitroApp._robotsPatternMap }
}

/**
 * Server-side bot detection using request headers
 * @param event H3 event object
 * @returns Bot detection context
 */
export function getBotDetection(event: H3Event) {
  const { headers, patternMap } = resolveBotDetectionInput(event)
  return getBotDetectionFromHeaders(headers, patternMap)
}

/**
 * Check if the current request is from a bot
 * @param event H3 event object
 * @returns boolean indicating if request is from a bot
 */
export function isBot(event: H3Event): boolean {
  const { headers, patternMap } = resolveBotDetectionInput(event)
  return isBotFromHeaders(headers, patternMap)
}

/**
 * Get bot information if detected
 * @param event H3 event object
 * @returns Bot info object or null
 */
export function getBotInfo(event: H3Event) {
  const { headers, patternMap } = resolveBotDetectionInput(event)
  return getBotInfoFromHeaders(headers, patternMap)
}
