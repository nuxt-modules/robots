// Enhanced bot detection analyzer with strict, context-aware heuristics
import type { H3Event } from 'h3'
import type { BotDetectionBehavior, SessionData } from './behavior'
import type { ImprovedDetectionContext, SiteProfile } from './improved-behavior'
import { getHeaders } from 'h3'
import {
  analyzeUserIntent,
  buildSiteProfile,
  IMPROVED_BEHAVIOR_WEIGHTS,

  scorePathAccess,

  updateCredibilityScore,
} from './improved-behavior'

// Global site profile (in production, this should be persisted)
const globalSiteProfile: { value: SiteProfile | null } = { value: null }

// Enhanced bot score thresholds (more strict)
export const ENHANCED_THRESHOLDS = {
  DEFINITELY_BOT: 80, // Lowered from 90 - we're more confident now
  LIKELY_BOT: 60, // Lowered from 70 - better precision
  SUSPICIOUS: 35, // Lowered from 40 - catch more edge cases
  PROBABLY_HUMAN: 15, // Lowered from 20 - positive scoring allows this
  DEFINITELY_HUMAN: -10, // NEW: Negative scores for highly trusted users
}

// Enhanced analysis with context awareness
export function enhancedBotAnalysis({
  event,
  behavior,
  timestamp: _timestamp = Date.now(),
  debug: _debug = false,
}: {
  event: H3Event
  behavior: BotDetectionBehavior
  timestamp?: number
  debug?: boolean
}): {
    botScore: number
    confidence: number
    factors: Array<{ type: string, score: number, reason: string }>
    context: ImprovedDetectionContext
    recommendation: 'allow' | 'challenge' | 'block'
  } {
  const path = event.path || ''
  const _method = event.method || 'GET'
  const headers = getHeaders(event)
  const sessionData = behavior.session
  const _ipData = behavior.ip

  // Build/update site profile
  globalSiteProfile.value = buildSiteProfile(event, globalSiteProfile.value || undefined)

  // Analyze user intent based on request history
  const userIntent = analyzeUserIntent(sessionData.lastRequests)

  // Build detection context
  const context: ImprovedDetectionContext = {
    userIntent: userIntent as 'browsing' | 'exploring' | 'scanning' | 'exploiting' | 'unknown',
    accessPattern: analyzeAccessPattern(sessionData) as 'human-like' | 'systematic' | 'random' | 'malicious',
    credibilityScore: sessionData.knownGoodActions * 5, // Convert to 0-100 scale
    authenticationStatus: detectAuthStatus(headers, path) as 'authenticated' | 'anonymous' | 'unknown',
    referrerContext: analyzeReferrer(headers) as 'internal' | 'search-engine' | 'direct' | 'suspicious',
    technicalProfile: analyzeTechnicalProfile(headers, sessionData),
  }

  // Enhanced scoring with context awareness
  const factors: Array<{ type: string, score: number, reason: string }> = []
  let totalScore = 0

  // 1. Context-aware path analysis
  const pathAnalysis = scorePathAccess(path, globalSiteProfile.value!, context)
  if (pathAnalysis.score !== 0) {
    factors.push({
      type: 'PATH_ACCESS',
      score: pathAnalysis.score,
      reason: pathAnalysis.reason,
    })
    totalScore += pathAnalysis.score
  }

  // 2. Intent-based scoring
  const intentScore = scoreUserIntent(context.userIntent, sessionData)
  if (intentScore !== 0) {
    factors.push({
      type: 'USER_INTENT',
      score: intentScore,
      reason: `Intent detected as: ${context.userIntent}`,
    })
    totalScore += intentScore
  }

  // 3. Positive scoring for good behavior
  const positiveScore = scorePositiveBehavior(context, sessionData, globalSiteProfile.value!)
  if (positiveScore !== 0) {
    factors.push({
      type: 'POSITIVE_BEHAVIOR',
      score: positiveScore,
      reason: 'Legitimate user behavior patterns detected',
    })
    totalScore += positiveScore
  }

  // 4. Technical profile analysis
  const techScore = scoreTechnicalProfile(context.technicalProfile)
  if (techScore !== 0) {
    factors.push({
      type: 'TECHNICAL_PROFILE',
      score: techScore,
      reason: 'Technical fingerprint analysis',
    })
    totalScore += techScore
  }

  // 5. Rate limiting with context
  const rateScore = scoreRateLimiting(sessionData, context, globalSiteProfile.value!)
  if (rateScore !== 0) {
    factors.push({
      type: 'RATE_LIMITING',
      score: rateScore,
      reason: 'Request rate analysis',
    })
    totalScore += rateScore
  }

  // 6. Enhanced timing analysis
  const timingScore = scoreTimingPatterns(sessionData, context)
  if (timingScore !== 0) {
    factors.push({
      type: 'TIMING_ANALYSIS',
      score: timingScore,
      reason: 'Request timing pattern analysis',
    })
    totalScore += timingScore
  }

  // Update credibility score
  const newCredibilityScore = updateCredibilityScore(
    context.credibilityScore,
    sessionData,
    context,
  )

  // Apply credibility bonus/penalty
  const credibilityAdjustment = (newCredibilityScore - 50) * 0.2 // -10 to +10 adjustment
  totalScore += credibilityAdjustment

  if (credibilityAdjustment !== 0) {
    factors.push({
      type: 'CREDIBILITY_ADJUSTMENT',
      score: credibilityAdjustment,
      reason: `User credibility: ${newCredibilityScore}/100`,
    })
  }

  // Calculate confidence based on number of data points
  const confidence = calculateConfidence(sessionData, factors.length)

  // Determine recommendation
  const recommendation = determineRecommendation(totalScore, confidence, context)

  return {
    botScore: Math.round(totalScore * 10) / 10, // Round to 1 decimal
    confidence,
    factors,
    context,
    recommendation,
  }
}

function analyzeAccessPattern(sessionData: SessionData): string {
  const requests = sessionData.lastRequests
  if (requests.length < 3)
    return 'unknown'

  // Check for human-like patterns
  const hasVariedTiming = checkTimingVariation(requests)
  const hasLogicalFlow = checkLogicalFlow(requests)
  const hasNaturalErrors = checkNaturalErrorPattern(requests)

  if (hasVariedTiming && hasLogicalFlow && hasNaturalErrors) {
    return 'human-like'
  }

  // Check for systematic patterns
  const isSystematic = checkSystematicAccess(requests)
  if (isSystematic)
    return 'systematic'

  // Check for random patterns (possible bot)
  const isRandom = checkRandomPattern(requests)
  if (isRandom)
    return 'random'

  return 'unknown'
}

function checkTimingVariation(requests: Array<{ timestamp: number }>): boolean {
  if (requests.length < 3)
    return true

  const intervals = []
  for (let i = 1; i < requests.length; i++) {
    intervals.push(requests[i].timestamp - requests[i - 1].timestamp)
  }

  const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length
  const variance = intervals.reduce((sum, val) => sum + (val - mean) ** 2, 0) / intervals.length
  const stdDev = Math.sqrt(variance)
  const coefficientOfVariation = stdDev / mean

  // Human timing should have some variation (> 0.3)
  return coefficientOfVariation > 0.3
}

function checkLogicalFlow(requests: Array<{ path: string }>): boolean {
  // Look for logical navigation patterns rather than random access
  const paths = requests.map(r => r.path)

  // Check for common logical flows
  const logicalPatterns = [
    /^\/$/, // Start at home
    /^\/[^/]+$/, // Go to main section
    /^\/[^/]+\/[^/]+/, // Go deeper
  ]

  // At least 50% should follow some logical pattern
  const logicalRequests = paths.filter(path =>
    logicalPatterns.some(pattern => pattern.test(path)),
  )

  return logicalRequests.length / paths.length > 0.5
}

function checkNaturalErrorPattern(requests: Array<{ status?: number }>): boolean {
  const errorCount = requests.filter(r => r.status && r.status >= 400).length
  const totalRequests = requests.length

  // Natural users have some errors (typos, broken links) but not too many
  const errorRate = errorCount / totalRequests
  return errorRate > 0.05 && errorRate < 0.3 // 5-30% error rate is natural
}

function checkSystematicAccess(requests: Array<{ path: string }>): boolean {
  const paths = requests.map(r => r.path)

  // Check for sequential patterns
  const numbers = paths.map((p) => {
    const match = p.match(/\/(\d+)/)
    return match ? Number.parseInt(match[1]) : null
  }).filter(n => n !== null)

  if (numbers.length >= 3) {
    const sorted = [...numbers].sort((a, b) => a - b)
    const isSequential = sorted.every((val, i) => i === 0 || val === sorted[i - 1] + 1)
    if (isSequential)
      return true
  }

  return false
}

function checkRandomPattern(requests: Array<{ path: string }>): boolean {
  const paths = requests.map(r => r.path)
  const uniquePaths = new Set(paths)

  // Very high unique path ratio with no logical flow suggests random access
  return (uniquePaths.size / paths.length) > 0.9 && paths.length > 5
}

function detectAuthStatus(headers: Record<string, any>, path: string): string {
  // Check for authentication headers/cookies
  const authHeaders = ['authorization', 'cookie', 'x-auth-token']
  const hasAuthHeaders = authHeaders.some(header => headers[header])

  if (hasAuthHeaders)
    return 'authenticated'
  if (path.includes('/login') || path.includes('/auth'))
    return 'unknown'
  return 'anonymous'
}

function analyzeReferrer(headers: Record<string, any>): string {
  const referrer = headers.referer || headers.referrer || ''

  if (!referrer)
    return 'direct'

  if (referrer.includes('google.com')
    || referrer.includes('bing.com')
    || referrer.includes('duckduckgo.com')) {
    return 'search-engine'
  }

  // Check if internal referrer
  try {
    const referrerUrl = new URL(referrer)
    const currentHost = headers.host
    if (referrerUrl.hostname === currentHost) {
      return 'internal'
    }
  }
  catch {}

  return 'external'
}

function analyzeTechnicalProfile(headers: Record<string, any>, sessionData: SessionData) {
  const _userAgent = headers['user-agent'] || ''
  const acceptLanguage = headers['accept-language'] || ''
  const acceptEncoding = headers['accept-encoding'] || ''

  const browserFeatures = []
  if (acceptLanguage)
    browserFeatures.push('language')
  if (acceptEncoding.includes('gzip'))
    browserFeatures.push('compression')
  if (headers['sec-ch-ua'])
    browserFeatures.push('client-hints')

  const networkConsistency = calculateNetworkConsistency(sessionData)
  const headerCredibility = calculateHeaderCredibility(headers)

  return {
    browserFeatures,
    networkConsistency,
    headerCredibility,
  }
}

function calculateNetworkConsistency(sessionData: SessionData): number {
  // Analyze if timing patterns suggest same network/client
  const requests = sessionData.lastRequests
  if (requests.length < 5)
    return 0.5 // Neutral

  const intervals = []
  for (let i = 1; i < requests.length; i++) {
    intervals.push(requests[i].timestamp - requests[i - 1].timestamp)
  }

  const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length
  const variance = intervals.reduce((sum, val) => sum + (val - mean) ** 2, 0) / intervals.length

  // Consistent network should have some baseline timing
  return Math.min(1, variance / 1000) // Normalize to 0-1
}

function calculateHeaderCredibility(headers: Record<string, any>): number {
  let credibility = 0.5 // Start neutral

  const userAgent = headers['user-agent'] || ''
  const acceptLanguage = headers['accept-language'] || ''

  // Positive indicators
  if (userAgent.includes('Mozilla/') && userAgent.includes('Chrome/'))
    credibility += 0.2
  if (acceptLanguage.includes(','))
    credibility += 0.1 // Multiple languages
  if (headers['sec-ch-ua'])
    credibility += 0.1 // Modern browser
  if (headers['accept-encoding']?.includes('br'))
    credibility += 0.1 // Brotli support

  // Negative indicators
  if (!userAgent)
    credibility -= 0.3
  if (userAgent.length < 20)
    credibility -= 0.2 // Too short
  if (!headers.accept)
    credibility -= 0.2

  return Math.max(0, Math.min(1, credibility))
}

function scoreUserIntent(intent: string, _sessionData: SessionData): number {
  switch (intent) {
    case 'browsing':
      return IMPROVED_BEHAVIOR_WEIGHTS.GOOD_NAVIGATION
    case 'exploring':
      return 0 // Neutral - legitimate exploration
    case 'scanning':
      return IMPROVED_BEHAVIOR_WEIGHTS.SYSTEMATIC_ENUMERATION
    case 'exploiting':
      return IMPROVED_BEHAVIOR_WEIGHTS.VULNERABILITY_PROBE
    default:
      return 0
  }
}

function scorePositiveBehavior(
  context: ImprovedDetectionContext,
  sessionData: SessionData,
  _siteProfile: SiteProfile,
): number {
  let positiveScore = 0

  // Reward legitimate referrers
  if (context.referrerContext === 'search-engine') {
    positiveScore += IMPROVED_BEHAVIOR_WEIGHTS.LEGITIMATE_REFERRER
  }

  // Reward proper headers
  if (context.technicalProfile.headerCredibility > 0.7) {
    positiveScore += IMPROVED_BEHAVIOR_WEIGHTS.PROPER_HEADERS
  }

  // Reward authenticated access
  if (context.authenticationStatus === 'authenticated') {
    positiveScore += IMPROVED_BEHAVIOR_WEIGHTS.AUTHENTICATED_ACCESS
  }

  // Reward content engagement (time between requests suggests reading)
  const avgInterval = sessionData.averageTimeBetweenRequests || 0
  if (avgInterval > 10000 && avgInterval < 120000) { // 10s - 2min suggests reading
    positiveScore += IMPROVED_BEHAVIOR_WEIGHTS.CONTENT_ENGAGEMENT
  }

  return positiveScore
}

function scoreTechnicalProfile(profile: any): number {
  let score = 0

  if (profile.headerCredibility < 0.3) {
    score += IMPROVED_BEHAVIOR_WEIGHTS.SUSPICIOUS_USER_AGENT
  }

  if (profile.browserFeatures.length < 2) {
    score += 10 // Penalty for minimal browser features
  }

  return score
}

function scoreRateLimiting(
  sessionData: SessionData,
  context: ImprovedDetectionContext,
  siteProfile: SiteProfile,
): number {
  const now = Date.now()
  const oneMinuteAgo = now - 60000
  const requestsLastMinute = sessionData.lastRequests.filter(r => r.timestamp > oneMinuteAgo).length

  // Context-aware rate limits
  let rateLimit = 15 // Default

  if (context.authenticationStatus === 'authenticated')
    rateLimit = 30
  if (siteProfile.apiEndpoints.length > 0 && context.userIntent === 'browsing')
    rateLimit = 25
  if (context.userIntent === 'scanning')
    rateLimit = 5 // Very strict for scanners

  if (requestsLastMinute > rateLimit) {
    const overage = requestsLastMinute - rateLimit
    return Math.min(IMPROVED_BEHAVIOR_WEIGHTS.API_ABUSE, overage * 5)
  }

  return 0
}

function scoreTimingPatterns(sessionData: SessionData, context: ImprovedDetectionContext): number {
  if (sessionData.lastRequests.length < 5)
    return 0

  const intervals = []
  for (let i = 1; i < sessionData.lastRequests.length; i++) {
    const interval = sessionData.lastRequests[i].timestamp - sessionData.lastRequests[i - 1].timestamp
    intervals.push(interval)
  }

  const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length
  const variance = intervals.reduce((sum, val) => sum + (val - mean) ** 2, 0) / intervals.length
  const stdDev = Math.sqrt(variance)
  const coefficientOfVariation = stdDev / mean

  // Only penalize if clearly robotic AND intent is suspicious
  if (coefficientOfVariation < 0.05 && mean < 2000 && context.userIntent === 'scanning') {
    return 30 // High penalty for robotic timing + suspicious intent
  }

  // Very strict for exploitation
  if (coefficientOfVariation < 0.1 && context.userIntent === 'exploiting') {
    return 40
  }

  return 0
}

function calculateConfidence(sessionData: SessionData, factorCount: number): number {
  // Confidence based on amount of data and number of detection factors
  const requestCount = sessionData.lastRequests.length
  const timeSpan = Date.now() - sessionData.firstSeenAt

  let confidence = 0

  // More requests = higher confidence
  confidence += Math.min(50, requestCount * 5)

  // Longer observation = higher confidence
  confidence += Math.min(30, timeSpan / (60000)) // Minutes observed

  // More detection factors = higher confidence
  confidence += Math.min(20, factorCount * 4)

  return Math.min(100, confidence)
}

function determineRecommendation(
  score: number,
  confidence: number,
  _context: ImprovedDetectionContext,
): 'allow' | 'challenge' | 'block' {
  // High confidence decisions
  if (confidence > 80) {
    if (score >= ENHANCED_THRESHOLDS.DEFINITELY_BOT)
      return 'block'
    if (score >= ENHANCED_THRESHOLDS.LIKELY_BOT)
      return 'challenge'
    if (score <= ENHANCED_THRESHOLDS.DEFINITELY_HUMAN)
      return 'allow'
  }

  // Medium confidence - be more conservative
  if (confidence > 50) {
    if (score >= ENHANCED_THRESHOLDS.DEFINITELY_BOT + 10)
      return 'block'
    if (score >= ENHANCED_THRESHOLDS.LIKELY_BOT + 5)
      return 'challenge'
  }

  // Low confidence - mostly allow with some challenges
  if (score >= ENHANCED_THRESHOLDS.DEFINITELY_BOT + 20)
    return 'block'
  if (score >= ENHANCED_THRESHOLDS.LIKELY_BOT + 15)
    return 'challenge'

  return 'allow'
}

export { globalSiteProfile }
