import type { H3Event } from 'h3'
import type { BotDetectionBehavior, IPData, SessionData } from './behavior'
import { useStorage } from '#imports'
import { getRequestIP, useSession } from 'h3'
import { TrafficType } from './behavior'

export async function initBotDetectionSession(event: H3Event) {
  const ip = getRequestIP(event, { xForwardedFor: true })
  // TODO runtimeConfig support
  const session = await useSession(event, {
    password: '80d42cfb-1cd2-462c-8f17-e3237d9027e9',
  })
  // fetch sdession data
  const sessionKey = `session:${session.id}`
  const ipKey = `ip:${ip}`
  // TODO runtimeConfig support
  return {
    sessionKey,
    ipKey,
    session,
    storage: useStorage('cache:robots:bot-detection'),
  }
}

export async function getBotDetectionBehavior(e: H3Event): Promise<BotDetectionBehavior> {
  const now = Date.now()
  const { ipKey, session, storage, sessionKey } = await initBotDetectionSession(e)
  const sessionData = storage.getItem<SessionData>(sessionKey)
  const ipData = storage.getItem<IPData>(ipKey)
  return Promise.all([
    sessionData,
    ipData,
  ]).then(([sessionData, ip]) => {
    return {
      id: session.id,
      session: sessionData || {
        lastRequests: [],
        suspiciousPathHits: 0,
        maybeSensitivePathHits: 0,
        uniqueSensitivePathsAccessed: [],
        errorCount: 0,
        lastScore: 0,
        score: 0,
        lastUpdated: now,
        trafficType: TrafficType.UNKNOWN,
        knownGoodActions: 0,
        requestMethodVariety: [],
        requestSequenceEntropy: 0,
        firstSeenAt: now,
      },
      ip: ip || {
        sessionCount: 0,
        activeSessions: [],
        suspiciousScore: 0,
        lastUpdated: now,
        legitSessionsCount: 0,
        isBot: false,
        isBotConfidence: 0,
        lastSessionCreated: now,
        factores: [],
      },
    } satisfies BotDetectionBehavior
  })
}

export async function updateBotSessionBehavior(e: H3Event, sessionData: BotDetectionBehavior) {
  const { ipKey, storage, sessionKey } = await initBotDetectionSession(e)
  return Promise.all([
    storage.setItem(sessionKey, sessionData.session),
    storage.setItem(ipKey, sessionData.ip),
  ])
}
