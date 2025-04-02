import { useRuntimeConfig, useStorage } from '#imports'
import { getHeaders, getRequestIP, useSession } from 'h3'
import { defineNitroPlugin } from 'nitropack/runtime'
import { analyzeBotBehavior } from '~/src/runtime/server/lib/is-bot/behavior'
import { isBotFromHeaders } from '~/src/runtime/server/lib/is-bot/userAgent'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', async (event) => {
    const ctx = isBotFromHeaders(getHeaders(event))
    event.context.isBot = ctx.isBot
    if (!ctx.isBot) {
      const kvStorage = useStorage('robots:bot-detection')
      const ip = getRequestIP(event)
      const path = event.path || ''
      const method = event.method || 'GET'
      const headers = getHeaders(event)
      const config = useRuntimeConfig()
      const session = await useSession(event, {
        password: config.robots.botDetectionSecret || '80d42cfb-1cd2-462c-8f17-e3237d9027e9',
      })
      // Call the extracted core analysis function with data from the event
      const behaviorCtx = await analyzeBotBehavior({
        ip,
        path,
        method,
        storage: kvStorage,
        session,
        headers,
      })
      event.context.isBot = behaviorCtx.isLikelyBot
      // persist data
      event.waitUntil(async () => {
        await Promise.all([
          kvStorage.setItem(behaviorCtx.ipKey, behaviorCtx.ipData, {
            ttl: 60 * 60 * 24 * 7, // 7 days
          }),
          kvStorage.setItem(behaviorCtx.sessionKey, behaviorCtx.sessionData, {
            ttl: 60 * 60 * 24 * 7, // 7 days
          }),
        ])
      })
    }
  })
})
