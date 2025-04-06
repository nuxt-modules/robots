import type { BotDetectionBehavior } from '../../server/lib/is-bot/behavior'
import { defineNuxtPlugin, onNuxtReady, useNuxtApp, useRequestEvent } from 'nuxt/app'
import { useBotDetection } from '../composables/useBotDetection'

export default defineNuxtPlugin({
  async setup() {
    const botContextState = useBotDetection()
    if (import.meta.server) {
      const context = useRequestEvent()?.context || {}
      const behavior = context.botDetectionBehavior as BotDetectionBehavior
      if (behavior) {
        botContextState.value = {
          isBot: behavior.ip!.isBot,
        }
      }
    }
    // need a unique key to store the bot detection result
    if (import.meta.client) {
      const storageKey = '__nuxt_robots:botd'
      const hasVerifiedWithBotD = window.localStorage.getItem(storageKey)
      const nuxtApp = useNuxtApp()
      if (!nuxtApp.payload.serverRendered) {
        navigator.sendBeacon('/__robots__/beacon')
      }
      if (!hasVerifiedWithBotD) {
        onNuxtReady(async () => {
          const { load } = await import('@fingerprintjs/botd').catch(() => ({ load: () => Promise.resolve({}) }))
          // Initialize an agent at application startup, once per page/app.
          const isBot = (await load()
            .catch(() => ({ detect: () => ({ isBot: false }) }))
          ).detect()
          window.localStorage.setItem(storageKey, 'true')
          if (isBot) {
            // persist isBot
            await nuxtApp.hooks.callHook('robots:bot-detected')
            navigator.sendBeacon('/__robots__/flag')
          }
        })
      }
    }
  },
})
