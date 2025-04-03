import { useStorage } from '#imports'
import {getHeaders, getQuery, getRequestIP, useSession} from 'h3'
import { defineNitroPlugin } from 'nitropack/runtime'
import {analyzeBehavior, TrafficType, updateBotScoreAfterRequest} from '../lib/is-bot/behavior'
import { isBotFromHeaders } from '../lib/is-bot/userAgent'

export default defineNitroPlugin((nitroApp) => {
  const kvStorage = useStorage('cache:robots:bot-detection')
  nitroApp.hooks.hook('request', async (event) => {
    const ip = getRequestIP(event, { xForwardedFor: true })
    const path = event.path || ''
    const method = event.method || 'GET'
    const headers = getHeaders(event)
    // const config = useRuntimeConfig()
    const session = await useSession(event, {
      password: '80d42cfb-1cd2-462c-8f17-e3237d9027e9',
    })
    const { isBot, data } = isBotFromHeaders(getHeaders(event))
    event.context.isBot = isBot
    // we need to watch behavior as well as they may be sending a "trusted" user agent
    const behaviorCtx = await analyzeBehavior({
      ip,
      path,
      method,
      storage: kvStorage,
      session,
      headers,
    })
    if (event.path === '/__robots__/beacon' && getQuery(event).isBot) {
      // client-side botd.js has detected they are a robot, mark them as a bot
      behaviorCtx.sessionData.score = 100
      behaviorCtx.sessionData.trafficType = TrafficType.MALICIOUS_BOT
      behaviorCtx.factors['BOTD'] = true
      console.log('set ctx', behaviorCtx)
    } else {
      console.log({ p: event.path, q: getQuery(event).isBot })
    }
    event.context.isBot = event.context.isBot || behaviorCtx.isLikelyBot
    event.context.botContext = {
      ...data,
      score: behaviorCtx.score,
      trafficType: behaviorCtx.trafficType,
      ipScore: behaviorCtx.ipScore,
    }
    event.context._botBehavior = behaviorCtx
    // persist data
  })
  nitroApp.hooks.hook('afterResponse', async (event) => {
    if (event.context.botBehavior) {
      await updateBotScoreAfterRequest(event, event.context._botBehavior, kvStorage)
    }
  })
})
