import { getHeaders } from 'h3'
import { defineNitroPlugin, useRuntimeConfig, useStorage } from 'nitropack/runtime'
import { isBotFromHeaders } from '../../../util'
import { 
  BotDetectionEngine, 
  H3SessionIdentifier, 
  H3ResponseStatusProvider,
  h3ToBotDetectionRequest,
  createTrackedBotDetectionRequest
} from '../../../libs/is-bot/src'
import { UnstorageBehaviorAdapter } from '../../../libs/is-bot/src/adapters/behavior-storage'

// Global instances for the plugin
let botDetectionEngine: BotDetectionEngine | null = null
let responseStatusProvider: H3ResponseStatusProvider | null = null

function initializeBotDetection() {
  if (botDetectionEngine) return botDetectionEngine

  const config = useRuntimeConfig()
  const botConfig = (config as any)?.robots?.botDetection || {}
  
  // Create storage adapter using Nitro's useStorage
  const storage = useStorage('cache:robots:bot-detection')
  const storageAdapter = new UnstorageBehaviorAdapter(storage, {
    sessionTTL: botConfig.session?.ttl || 24 * 60 * 60 * 1000,
    ipTTL: botConfig.ip?.ttl || 7 * 24 * 60 * 60 * 1000,
    siteProfileTTL: botConfig.siteProfile?.ttl || 30 * 24 * 60 * 60 * 1000
  })

  // Create session identifier
  const sessionIdentifier = new H3SessionIdentifier(
    botConfig.session?.password || '80d42cfb-1cd2-462c-8f17-e3237d9027e9'
  )

  // Create response status provider
  responseStatusProvider = new H3ResponseStatusProvider()

  // Create bot detection engine
  botDetectionEngine = new BotDetectionEngine({
    storage: storageAdapter,
    sessionIdentifier,
    responseStatusProvider,
    config: {
      session: {
        ttl: botConfig.session?.ttl || 24 * 60 * 60 * 1000,
        maxSessionsPerIP: botConfig.session?.maxSessionsPerIP || 10
      },
      thresholds: {
        definitelyBot: botConfig.thresholds?.definitelyBot || 90,
        likelyBot: botConfig.thresholds?.likelyBot || 70,
        suspicious: botConfig.thresholds?.suspicious || 40
      },
      ipFilter: {
        trustedIPs: [...(botConfig.ipFilter?.trustedIPs || []), '127.0.0.1', '::1'],
        blockedIPs: botConfig.ipFilter?.blockedIPs || []
      },
      debug: botConfig.debug || false,
      customSensitivePaths: botConfig.customSensitivePaths || [],
      behaviors: botConfig.behaviors
    }
  })

  return botDetectionEngine
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', async (event) => {
    try {
      const engine = initializeBotDetection()
      
      // Quick user-agent check first (legacy compatibility)
      const { isBot, data } = isBotFromHeaders(getHeaders(event))
      if (isBot) {
        event.context.botDetection = {
          isBot: true,
          confidence: 100,
          score: 100,
          factors: [{ type: 'USER_AGENT', score: 100, reason: 'Bot detected via user agent' }],
          recommendation: 'block',
          sessionId: 'ua-bot',
          legacy: true,
          details: data ? {
            name: data.botName,
            type: data.botCategory,
            trusted: data.trusted
          } : null
        }
        return
      }

      // Use framework-agnostic bot detection engine
      const request = createTrackedBotDetectionRequest(event, responseStatusProvider!)
      const result = await engine.analyze(request, event)
      
      event.context.botDetection = result
      
    } catch (error) {
      // Fallback to legacy detection on error
      const { isBot, data } = isBotFromHeaders(getHeaders(event))
      event.context.botDetection = {
        isBot,
        confidence: isBot ? 100 : 0,
        score: isBot ? 100 : 0,
        factors: isBot ? [{ type: 'USER_AGENT', score: 100, reason: 'Bot detected via user agent (fallback)' }] : [],
        recommendation: isBot ? 'block' : 'allow',
        sessionId: 'fallback',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  nitroApp.hooks.hook('afterResponse', async (event) => {
    // The engine handles storage updates internally during analysis
    // No additional storage operations needed here
  })
})
