import type { H3Event } from 'h3'
import { getHeaders } from 'h3'
import { getBotDetection as getBotDetectionFromHeaders, getBotInfo as getBotInfoFromHeaders, isBot as isBotFromHeaders } from '../../../util'

// Re-export the interface from util
export type { BotDetectionContext } from '../../../util'

/**
 * Server-side bot detection using request headers
 * @param event H3 event object
 * @returns Bot detection context
 */
export function getBotDetection(event: H3Event) {
  const headers = getHeaders(event) || {}
  return getBotDetectionFromHeaders(headers)
}

/**
 * Check if the current request is from a bot
 * @param event H3 event object
 * @returns boolean indicating if request is from a bot
 */
export function isBot(event: H3Event): boolean {
  const headers = getHeaders(event) || {}
  return isBotFromHeaders(headers)
}

/**
 * Get bot information if detected
 * @param event H3 event object
 * @returns Bot info object or null
 */
export function getBotInfo(event: H3Event) {
  const headers = getHeaders(event) || {}
  return getBotInfoFromHeaders(headers)
}
