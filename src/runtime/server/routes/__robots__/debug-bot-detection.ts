import { defineEventHandler, getQuery } from 'h3'
import { getBotDetectionBehavior } from '../../lib/is-bot/storage'
import { analyzeSessionAndIpBehavior } from '../../lib/is-bot/behavior'

/**
 * Debug endpoint for bot detection analysis
 * Returns detailed information about the current session's bot detection status
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const detailed = query.detailed === 'true'
    
    // Get current behavior analysis
    const behavior = await getBotDetectionBehavior(event)
    
    // Run analysis with debug enabled to get detailed info
    analyzeSessionAndIpBehavior({
      event,
      behavior,
      debug: true,
    })
    
    const response = {
      timestamp: Date.now(),
      session: {
        id: behavior.id,
        isBot: behavior.ip.isBot,
        confidence: behavior.ip.isBotConfidence,
        score: behavior.session.score,
        trafficType: behavior.session.trafficType,
        requestCount: behavior.session.lastRequests.length,
        sessionAge: Date.now() - behavior.session.firstSeenAt,
      },
      ip: {
        sessionCount: behavior.ip.sessionCount,
        suspiciousScore: behavior.ip.suspiciousScore,
        legitSessionsCount: behavior.ip.legitSessionsCount,
        factors: behavior.ip.factores,
        details: behavior.ip.details,
      },
      debug: behavior.debug,
    }
    
    // Include detailed information if requested
    if (detailed) {
      return {
        ...response,
        rawBehavior: behavior,
        constants: {
          BOT_SCORE_THRESHOLDS: await import('../../lib/is-bot/behavior').then(m => m.BOT_SCORE_THRESHOLDS),
          BEHAVIOR_WEIGHTS: await import('../../lib/is-bot/behavior').then(m => m.BEHAVIOR_WEIGHTS),
          SENSITIVE_PATHS: await import('../../lib/is-bot/behavior').then(m => m.SENSITIVE_PATHS),
        }
      }
    }
    
    return response
  }
  catch (error) {
    return {
      error: 'Bot detection debug failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    }
  }
})