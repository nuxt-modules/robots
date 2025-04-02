import { defineNuxtPlugin, onNuxtReady, useRequestEvent, useState } from 'nuxt/app'

export default defineNuxtPlugin({
  async setup(nuxtApp) {
    const isBot = useState('isBot', () => null)
    if (import.meta.server) {
      isBot.value = useRequestEvent()?.context?.isBot
    }
    // need a unique key to store the bot detection result
    if (isBot.value) {
      await nuxtApp.hooks.callHook('robots:bot-detected')
    }
    else if (import.meta.client) {
      onNuxtReady(async () => {
        const { load } = await import('@fingerprintjs/botd')
        // Initialize an agent at application startup, once per page/app.
        const isBot = (await load()).detect()
        if (isBot) {
          // persist isBot
          await nuxtApp.hooks.callHook('robots:bot-detected')
        }
      })
    }
  },
})
