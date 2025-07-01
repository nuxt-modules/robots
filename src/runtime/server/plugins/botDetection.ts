import { getHeaders } from 'h3'
import { defineNitroPlugin } from 'nitropack/runtime'
import { analyzeSessionAndIpBehavior, applyBehaviorForErrorPages } from '../lib/is-bot/behavior'
import { getBotDetectionBehavior, updateBotSessionBehavior } from '../lib/is-bot/storage'
import { isBotFromHeaders } from '../../../util'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', async (event) => {
    const config = useRuntimeConfig()
    const debugMode = config.public?.robots?.debug || false
    const behavior = await getBotDetectionBehavior(event)
    // if it's already a bot return early
    if (!behavior.ip?.isBot) {
      event.context.botDetectionBehavior = behavior
      return
    }
    const { isBot, data } = isBotFromHeaders(getHeaders(event))
    if (isBot) {
      behavior.ip.details = data ? {
        name: data.botName,
        type: data.botCategory,
        trusted: data.trusted
      } : null
      behavior.ip.isBot = isBot
      behavior.dirty = true
      behavior.ip.factores.push('user-agent')
      event.context.botDetectionBehavior = behavior
      return
    }
    if (!behavior.ip?.isBot) {
      analyzeSessionAndIpBehavior({
        event,
        behavior,
        debug: debugMode,
      })
    }
    event.context.botDetectionBehavior = behavior
  })
  nitroApp.hooks.hook('afterResponse', async (event) => {
    const behavior = event.context.botDetectionBehavior
    if (behavior && !behavior.ip?.isBot) {
      applyBehaviorForErrorPages(event, behavior)
    }
    if (event.context.botDetectionBehavior.dirty) {
      await updateBotSessionBehavior(event, event.context.botDetectionBehavior)
    }
  })
})
