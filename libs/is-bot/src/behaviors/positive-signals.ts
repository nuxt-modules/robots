// Positive signals that indicate legitimate users
import type { SessionData } from '../behavior'
import type { ImprovedDetectionContext } from '../improved-behavior'

/**
 * Simple positive signals - clear indicators of human behavior
 * Low complexity, high confidence
 */
export function analyzeBasicPositiveSignals(
  headers: Record<string, any>,
  sessionData: SessionData,
): { score: number, reason: string } {
  let positiveScore = 0
  const reasons = []

  // Legitimate referrer
  const referrer = headers.referer || headers.referrer || ''
  if (referrer && (
    referrer.includes('google.com')
    || referrer.includes('bing.com')
    || referrer.includes('duckduckgo.com')
  )) {
    positiveScore += 10
    reasons.push('search-engine-referrer')
  }

  // Time spent reading (reasonable intervals between requests)
  if (sessionData.lastRequests.length >= 3) {
    const intervals = []
    for (let i = 1; i < sessionData.lastRequests.length; i++) {
      const interval = sessionData.lastRequests[i].timestamp - sessionData.lastRequests[i - 1].timestamp
      intervals.push(interval)
    }

    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length

    // 5-120 seconds between requests suggests reading
    if (avgInterval > 5000 && avgInterval < 120000) {
      positiveScore += 15
      reasons.push('content-engagement')
    }
  }

  // Standard browser headers
  if (headers['accept-language'] && headers['accept-encoding']) {
    positiveScore += 5
    reasons.push('complete-headers')
  }

  // Authentication cookies (if present)
  const cookies = headers.cookie || ''
  if (cookies.includes('session') || cookies.includes('auth') || cookies.includes('login')) {
    positiveScore += 20
    reasons.push('authenticated-session')
  }

  if (positiveScore > 0) {
    return { score: -positiveScore, reason: `positive-signals: ${reasons.join(', ')}` }
  }

  return { score: 0, reason: 'no-positive-signals' }
}

/**
 * Advanced positive signal analysis with behavioral learning
 * Higher complexity, may be less reliable
 */
export function analyzeAdvancedPositiveSignals(
  headers: Record<string, any>,
  sessionData: SessionData,
  _context: ImprovedDetectionContext,
): { score: number, reason: string } {
  let positiveScore = 0
  const reasons = []

  // Credibility building over time
  if (sessionData.knownGoodActions > 5) {
    positiveScore += Math.min(20, sessionData.knownGoodActions * 2)
    reasons.push(`credibility-score: ${sessionData.knownGoodActions}`)
  }

  // Consistent user agent over session
  if (sessionData.lastRequests.length > 5) {
    // This would require tracking user agent per request - complex
    positiveScore += 5
    reasons.push('consistent-identity')
  }

  // Natural error patterns (humans make typos)
  const recentRequests = sessionData.lastRequests.slice(-10)
  const errorRate = recentRequests.filter(r => r.status === 404).length / recentRequests.length
  if (errorRate > 0.05 && errorRate < 0.2) { // 5-20% error rate is human-like
    positiveScore += 8
    reasons.push('natural-error-pattern')
  }

  // Form interactions (if we tracked them)
  // This would require additional tracking infrastructure

  // Mobile vs desktop patterns
  const userAgent = headers['user-agent'] || ''
  if (userAgent.includes('Mobile') || userAgent.includes('iPhone') || userAgent.includes('Android')) {
    // Mobile users often have different patterns
    positiveScore += 5
    reasons.push('mobile-device')
  }

  // Geographic consistency (would need IP geolocation)
  // Complex and requires external services

  if (positiveScore > 0) {
    return { score: -positiveScore, reason: `advanced-positive: ${reasons.join(', ')}` }
  }

  return { score: 0, reason: 'no-advanced-positive-signals' }
}

/**
 * Machine learning-like behavioral scoring
 * Very complex, high maintenance overhead
 */
export function analyzeBehavioralCredibility(sessionData: SessionData): { score: number, reason: string } {
  // This would ideally use a trained model, but for now we'll use heuristics

  let credibilityScore = 50 // Start neutral
  const factors = []

  // Session age factor
  const sessionAge = Date.now() - sessionData.firstSeenAt
  if (sessionAge > 5 * 60 * 1000) { // 5+ minutes
    credibilityScore += 10
    factors.push('established-session')
  }

  // Request variety
  const uniquePaths = new Set(sessionData.lastRequests.map(r => r.path))
  const varietyRatio = uniquePaths.size / sessionData.lastRequests.length
  if (varietyRatio > 0.3 && varietyRatio < 0.8) { // Sweet spot for humans
    credibilityScore += 5
    factors.push('good-path-variety')
  }

  // Timing variance (humans are inconsistent)
  if (sessionData.lastRequests.length >= 5) {
    const intervals = []
    for (let i = 1; i < sessionData.lastRequests.length; i++) {
      const interval = sessionData.lastRequests[i].timestamp - sessionData.lastRequests[i - 1].timestamp
      intervals.push(interval)
    }

    const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length
    const variance = intervals.reduce((sum, val) => sum + (val - mean) ** 2, 0) / intervals.length
    const coefficientOfVariation = Math.sqrt(variance) / mean

    if (coefficientOfVariation > 0.3) { // Good human-like variance
      credibilityScore += 8
      factors.push('human-timing-variance')
    }
  }

  // Error recovery (humans click back, retry, etc.)
  const errors = sessionData.lastRequests.filter(r => r.status && r.status >= 400)
  if (errors.length > 0 && errors.length < sessionData.lastRequests.length) {
    // Check if there were successful requests after errors
    const hasRecovery = errors.some(errorReq =>
      sessionData.lastRequests.some(req =>
        req.timestamp > errorReq.timestamp && (!req.status || req.status < 400),
      ),
    )

    if (hasRecovery) {
      credibilityScore += 10
      factors.push('error-recovery-behavior')
    }
  }

  // Convert credibility score to bot detection score
  const adjustment = (credibilityScore - 50) * 0.3 // Scale to reasonable range

  if (Math.abs(adjustment) > 2) {
    return {
      score: -adjustment,
      reason: `behavioral-credibility: ${credibilityScore}/100 (${factors.join(', ')})`,
    }
  }

  return { score: 0, reason: 'neutral-credibility' }
}
