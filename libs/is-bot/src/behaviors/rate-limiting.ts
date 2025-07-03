// Rate limiting bot detection behavior
import type { SessionData } from '../behavior'
import type { ImprovedDetectionContext } from '../improved-behavior'

/**
 * Simple rate limiting check
 * Low complexity, high reliability
 */
export function analyzeBasicRateLimit(sessionData: SessionData): { score: number, reason: string } {
  const now = Date.now()
  const oneMinuteAgo = now - 60000
  const requestsLastMinute = sessionData.lastRequests.filter(r => r.timestamp > oneMinuteAgo).length

  // Fixed thresholds - simple and predictable
  if (requestsLastMinute > 30) {
    return { score: 50, reason: `excessive-requests: ${requestsLastMinute}/min` }
  }

  if (requestsLastMinute > 20) {
    return { score: 25, reason: `high-requests: ${requestsLastMinute}/min` }
  }

  if (requestsLastMinute > 15) {
    return { score: 10, reason: `elevated-requests: ${requestsLastMinute}/min` }
  }

  return { score: 0, reason: 'normal-rate' }
}

/**
 * Context-aware rate limiting with adaptive thresholds
 * Higher complexity, may be error-prone in edge cases
 */
export function analyzeContextualRateLimit(
  sessionData: SessionData,
  context: ImprovedDetectionContext,
): { score: number, reason: string } {
  const now = Date.now()
  const oneMinuteAgo = now - 60000
  const requestsLastMinute = sessionData.lastRequests.filter(r => r.timestamp > oneMinuteAgo).length

  // Dynamic rate limits based on context
  let rateLimit = 15 // Default

  // Adjust based on authentication status
  if (context.authenticationStatus === 'authenticated') {
    rateLimit = 30 // Authenticated users get higher limits
  }

  // Adjust based on user intent
  if (context.userIntent === 'scanning') {
    rateLimit = 5 // Very strict for scanners
  }
  else if (context.userIntent === 'browsing') {
    rateLimit = 25 // More lenient for browsers
  }

  // Adjust based on referrer
  if (context.referrerContext === 'search-engine') {
    rateLimit += 5 // Slight bonus for search engine referrals
  }

  if (requestsLastMinute > rateLimit) {
    const overage = requestsLastMinute - rateLimit
    const score = Math.min(50, overage * 3)
    return {
      score,
      reason: `contextual-rate-exceeded: ${requestsLastMinute}/${rateLimit} (intent: ${context.userIntent})`,
    }
  }

  return { score: 0, reason: 'within-rate-limit' }
}

/**
 * Burst detection - looks for sudden spikes in activity
 * Medium complexity, good for catching automated tools
 */
export function analyzeBurstPattern(sessionData: SessionData): { score: number, reason: string } {
  if (sessionData.lastRequests.length < 10) {
    return { score: 0, reason: 'insufficient-data' }
  }

  const now = Date.now()
  const intervals = [10000, 30000, 60000] // 10s, 30s, 1min windows

  for (const interval of intervals) {
    const windowStart = now - interval
    const requestsInWindow = sessionData.lastRequests.filter(r => r.timestamp > windowStart).length
    const expectedMax = Math.ceil(interval / 2000) // Rough estimate: 1 request per 2 seconds max

    if (requestsInWindow > expectedMax * 2) {
      const windowSeconds = interval / 1000
      return {
        score: 30,
        reason: `burst-detected: ${requestsInWindow} requests in ${windowSeconds}s`,
      }
    }
  }

  return { score: 0, reason: 'normal-burst-pattern' }
}
