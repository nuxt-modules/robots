import { defineEventHandler } from 'h3'
import { getBotDetectionBehavior, updateBotSessionBehavior } from '../../lib/is-bot/storage'

/**
 * This route is called using a beacon request from the client, telling the server that the client has failed the
 * bot detection test.
 */
export default defineEventHandler(async (e) => {
  const behavior = await getBotDetectionBehavior(e)
  behavior.ip.isBot = true
  behavior.ip.factores.push('botd.js')
  await updateBotSessionBehavior(e, behavior)
})
