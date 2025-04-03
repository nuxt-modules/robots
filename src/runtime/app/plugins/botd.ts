import { useBotDetection } from '#robots/app/composables/useBotDetection'
import { defineNuxtPlugin, onNuxtReady, useRequestEvent } from 'nuxt/app'

export default defineNuxtPlugin({
  async setup() {
    const botContextState = useBotDetection()
    if (import.meta.server) {
      const context = useRequestEvent()?.context || {}
      console.log(context)
      botContextState.value = { isBot: context.isBot, ...(context.botContext || {}) }
    }
    // need a unique key to store the bot detection result
    if (import.meta.client) {
      const hasVerifiedWithBotD = window.localStorage.getItem('hasVerifiedWithBotD')
      const nuxtApp = useNuxtApp()
      if (!nuxtApp.payload.serverRendered) {
        navigator.sendBeacon('/__robots__/beacon')
      }
      if (hasVerifiedWithBotD) {
        onNuxtReady(async () => {
          const { load } = await import('@fingerprintjs/botd').catch(() => ({ load: () => ({}) }))
          // Initialize an agent at application startup, once per page/app.
          const isBot = (await load()
            .catch(() => ({ detect: () => ({ isBot: false }) }))
          ).detect()
          window.localStorage.getItem('hasVerifiedWithBotD', true)
          if (isBot) {
            // persist isBot
            await nuxtApp.hooks.callHook('robots:bot-detected')
            navigator.sendBeacon('/__robots__/beacon?isBot=true')
          }
        })
      }
    }
  },
})
