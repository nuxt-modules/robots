// Modular bot detection analyzer - framework agnostic
import type { H3Event } from 'h3'
import { getHeaders } from 'h3'
import type { DetectionContext } from './types'
import type { BotDetectionBehaviorConfig } from './behaviors'
import type { BotDetectionBehavior } from './behavior'
import {
  analyzeAdvancedIntent,
  analyzeAdvancedPositiveSignals,
  // Advanced behaviors
  analyzeAdvancedTiming,
  analyzeBasicPositiveSignals,
  analyzeBasicRateLimit,
  analyzeBasicTiming,

  analyzeBasicUserAgent,
  analyzeBehavioralCredibility,
  analyzeBrowserFingerprint,

  // Intermediate behaviors
  analyzeBurstPattern,
  analyzeContextualRateLimit,
  analyzeHeaderConsistency,
  // Simple behaviors
  analyzePathAccess,
  analyzeSimplePatterns,

  // Configuration
  DEFAULT_BEHAVIOR_CONFIG,
} from './behaviors'
import { buildBasicSiteProfile } from './behaviors/path-analysis'

// Global site profile and config
let globalSiteProfile: any = null
let behaviorConfig = DEFAULT_BEHAVIOR_CONFIG

/**
 * Modular bot analysis - choose which behaviors to enable
 */
export function modularBotAnalysis({
  event,
  behavior,
  config = behaviorConfig,
  debug: _debug = false,
}: {
  event: H3Event
  behavior: BotDetectionBehavior
  config?: BotDetectionBehaviorConfig
  debug?: boolean
}): {
    botScore: number
    confidence: number
    factors: Array<{ type: string, score: number, reason: string }>
    recommendation: 'allow' | 'challenge' | 'block'
  } {
  const path = event.path || ''
  const headers = getHeaders(event)
  const sessionData = behavior.session

  // Build simple site profile
  globalSiteProfile = buildBasicSiteProfile(event, globalSiteProfile)

  // Build basic context (without complex analysis)
  const context: DetectionContext = {
    userIntent: 'unknown' as 'browsing' | 'exploring' | 'scanning' | 'exploiting' | 'unknown',
    accessPattern: 'unknown' as 'human-like' | 'systematic' | 'random' | 'malicious',
    credibilityScore: sessionData.knownGoodActions * 5,
    authenticationStatus: detectSimpleAuthStatus(headers, path) as 'authenticated' | 'anonymous' | 'unknown',
    referrerContext: analyzeSimpleReferrer(headers) as 'internal' | 'search-engine' | 'direct' | 'suspicious',
    technicalProfile: {
      browserFeatures: [],
      networkConsistency: 0.5,
      headerCredibility: 0.5,
    },
  }

  const factors: Array<{ type: string, score: number, reason: string }> = []
  let totalScore = 0

  // Apply simple behaviors
  if (config.simple.pathAnalysis.enabled) {
    const result = analyzePathAccess(path, context)
    if (result.score !== 0) {
      const adjustedScore = result.score * config.simple.pathAnalysis.weight
      factors.push({ type: 'PATH_ANALYSIS', score: adjustedScore, reason: result.reason })
      totalScore += adjustedScore
    }
  }

  if (config.simple.basicTiming.enabled) {
    const result = analyzeBasicTiming(sessionData)
    if (result.score !== 0) {
      const adjustedScore = result.score * config.simple.basicTiming.weight
      factors.push({ type: 'BASIC_TIMING', score: adjustedScore, reason: result.reason })
      totalScore += adjustedScore
    }
  }

  if (config.simple.basicRateLimit.enabled) {
    const result = analyzeBasicRateLimit(sessionData)
    if (result.score !== 0) {
      const adjustedScore = result.score * config.simple.basicRateLimit.weight
      factors.push({ type: 'BASIC_RATE_LIMIT', score: adjustedScore, reason: result.reason })
      totalScore += adjustedScore
    }
  }

  if (config.simple.basicUserAgent.enabled) {
    const result = analyzeBasicUserAgent(headers)
    if (result.score !== 0) {
      const adjustedScore = result.score * config.simple.basicUserAgent.weight
      factors.push({ type: 'BASIC_USER_AGENT', score: adjustedScore, reason: result.reason })
      totalScore += adjustedScore
    }
  }

  if (config.simple.simplePatterns.enabled) {
    const result = analyzeSimplePatterns(sessionData)
    if (result.score !== 0) {
      const adjustedScore = result.score * config.simple.simplePatterns.weight
      factors.push({ type: 'SIMPLE_PATTERNS', score: adjustedScore, reason: result.reason })
      totalScore += adjustedScore
    }
  }

  if (config.simple.basicPositiveSignals.enabled) {
    const result = analyzeBasicPositiveSignals(headers, sessionData)
    if (result.score !== 0) {
      const adjustedScore = result.score * config.simple.basicPositiveSignals.weight
      factors.push({ type: 'BASIC_POSITIVE_SIGNALS', score: adjustedScore, reason: result.reason })
      totalScore += adjustedScore
    }
  }

  // Apply intermediate behaviors if enabled
  if (config.intermediate.burstDetection.enabled) {
    const result = analyzeBurstPattern(sessionData)
    if (result.score !== 0) {
      const adjustedScore = result.score * config.intermediate.burstDetection.weight
      factors.push({ type: 'BURST_DETECTION', score: adjustedScore, reason: result.reason })
      totalScore += adjustedScore
    }
  }

  if (config.intermediate.headerConsistency.enabled) {
    const result = analyzeHeaderConsistency(headers)
    if (result.score !== 0) {
      const adjustedScore = result.score * config.intermediate.headerConsistency.weight
      factors.push({ type: 'HEADER_CONSISTENCY', score: adjustedScore, reason: result.reason })
      totalScore += adjustedScore
    }
  }

  if (config.intermediate.contextualRateLimit.enabled) {
    const result = analyzeContextualRateLimit(sessionData, context)
    if (result.score !== 0) {
      const adjustedScore = result.score * config.intermediate.contextualRateLimit.weight
      factors.push({ type: 'CONTEXTUAL_RATE_LIMIT', score: adjustedScore, reason: result.reason })
      totalScore += adjustedScore
    }
  }

  // Apply advanced behaviors if enabled (use with caution)
  if (config.advanced.advancedTiming.enabled) {
    const result = analyzeAdvancedTiming(sessionData)
    if (result.score !== 0) {
      const adjustedScore = result.score * config.advanced.advancedTiming.weight
      factors.push({ type: 'ADVANCED_TIMING', score: adjustedScore, reason: result.reason })
      totalScore += adjustedScore
    }
  }

  if (config.advanced.advancedIntent.enabled) {
    const result = analyzeAdvancedIntent(sessionData)
    if (result.score !== 0) {
      const adjustedScore = result.score * config.advanced.advancedIntent.weight
      factors.push({ type: 'ADVANCED_INTENT', score: adjustedScore, reason: result.reason })
      totalScore += adjustedScore
    }
  }

  if (config.advanced.browserFingerprint.enabled) {
    const result = analyzeBrowserFingerprint(headers, sessionData)
    if (result.score !== 0) {
      const adjustedScore = result.score * config.advanced.browserFingerprint.weight
      factors.push({ type: 'BROWSER_FINGERPRINT', score: adjustedScore, reason: result.reason })
      totalScore += adjustedScore
    }
  }

  if (config.advanced.advancedPositiveSignals.enabled) {
    const result = analyzeAdvancedPositiveSignals(headers, sessionData, context)
    if (result.score !== 0) {
      const adjustedScore = result.score * config.advanced.advancedPositiveSignals.weight
      factors.push({ type: 'ADVANCED_POSITIVE_SIGNALS', score: adjustedScore, reason: result.reason })
      totalScore += adjustedScore
    }
  }

  if (config.advanced.behavioralCredibility.enabled) {
    const result = analyzeBehavioralCredibility(sessionData)
    if (result.score !== 0) {
      const adjustedScore = result.score * config.advanced.behavioralCredibility.weight
      factors.push({ type: 'BEHAVIORAL_CREDIBILITY', score: adjustedScore, reason: result.reason })
      totalScore += adjustedScore
    }
  }

  // Calculate confidence based on number of active behaviors
  const activeFactors = factors.length
  const requestCount = sessionData.lastRequests.length
  const confidence = Math.min(100, (activeFactors * 10) + (requestCount * 3))

  // Simple thresholds
  const recommendation = determineSimpleRecommendation(totalScore, confidence)

  return {
    botScore: Math.round(totalScore * 10) / 10,
    confidence,
    factors,
    recommendation,
  }
}

// Simple helper functions
function detectSimpleAuthStatus(headers: Record<string, any>, path: string): string {
  const authHeaders = ['authorization', 'cookie']
  if (authHeaders.some(header => headers[header]))
    return 'authenticated'
  if (path.includes('/login') || path.includes('/auth'))
    return 'unknown'
  return 'anonymous'
}

function analyzeSimpleReferrer(headers: Record<string, any>): string {
  const referrer = headers.referer || headers.referrer || ''
  if (!referrer)
    return 'direct'
  if (referrer.includes('google.com') || referrer.includes('bing.com'))
    return 'search-engine'
  return 'external'
}

function determineSimpleRecommendation(score: number, _confidence: number): 'allow' | 'challenge' | 'block' {
  // Conservative thresholds
  if (score >= 50)
    return 'block'
  if (score >= 30)
    return 'challenge'
  return 'allow'
}

// Configuration setter
export function setBehaviorConfig(config: Partial<BotDetectionBehaviorConfig>) {
  behaviorConfig = {
    simple: { ...behaviorConfig.simple, ...config.simple },
    intermediate: { ...behaviorConfig.intermediate, ...config.intermediate },
    advanced: { ...behaviorConfig.advanced, ...config.advanced },
  }
}

export { type BotDetectionBehaviorConfig, DEFAULT_BEHAVIOR_CONFIG }
