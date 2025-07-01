// src/runtime/server/lib/botd.ts
import type { H3Event } from 'h3'
import { getResponseStatus } from 'h3'

// Common sensitive paths that bots target - expanded with more patterns
export const SENSITIVE_PATHS = [
  '/wp-login',
  '/xmlrpc.php',
  '/.env',
  '/phpmyadmin',
  '/setup',
  '/install',
  '/config',
  '/.git',
  '/.svn',
  '/api/graphql',
  '/graphql',
  // Additional common bot targets
  '/wp-content',
  '/wp-includes',
  '/wp-json',
  '/.well-known/security.txt',
  '/vendor/',
  '/server-status',
  '/solr/',
  '/jenkins/',
  '/.DS_Store',
  '/actuator/',
  '/console/',
  '/wp-admin',
  '/admin-login.php',
  '/wp-login-hidden',
]

// Honeypot/high-sensitivity paths - these could be legitimate in some cases
// but are frequently targeted by bots and rarely used by regular users
export const MAYBE_SENSITIVE_PATHS = [
  '/admin',
  '/login',
  '/administrator',
  '/includes/config',
  '/.hidden-login',
  '/robots.txt.bak',
  '/administrator/index.php',
  '/myadmin',
  '/admin_area',
  '/panel',
  '/cpanel',
  '/dashboard',
]

import { useRuntimeConfig } from '#imports'

// Enhanced bot detection score thresholds with an intermediate level
export let BOT_SCORE_THRESHOLDS = {
  DEFINITELY_BOT: 90,
  LIKELY_BOT: 70,
  SUSPICIOUS: 40,
  PROBABLY_HUMAN: 20,
  DEFINITELY_HUMAN: 5,
}

// Configuration initialization
let behaviorConfigInitialized = false
function initializeBehaviorConfig() {
  if (behaviorConfigInitialized) return
  
  try {
    const config = useRuntimeConfig()
    const botConfig = config.public?.robots?.botDetection
    
    if (botConfig && typeof botConfig === 'object' && botConfig.thresholds) {
      if (botConfig.thresholds.definitelyBot) {
        BOT_SCORE_THRESHOLDS.DEFINITELY_BOT = botConfig.thresholds.definitelyBot
      }
      if (botConfig.thresholds.likelyBot) {
        BOT_SCORE_THRESHOLDS.LIKELY_BOT = botConfig.thresholds.likelyBot
      }
      if (botConfig.thresholds.suspicious) {
        BOT_SCORE_THRESHOLDS.SUSPICIOUS = botConfig.thresholds.suspicious
      }
      
      // Add custom sensitive paths
      if (botConfig.customSensitivePaths) {
        SENSITIVE_PATHS.push(...botConfig.customSensitivePaths)
      }
    }
    
    behaviorConfigInitialized = true
  } catch (error) {
    // Fallback to defaults if config is not available
    behaviorConfigInitialized = true
  }
}

// Updated behavior weights with increased penalties for timing issues
export const BEHAVIOR_WEIGHTS = {
  SENSITIVE_PATH: 15, // Accessing known sensitive paths
  MAYBE_SENSITIVE_PATH: 5, // Accessing potentially sensitive paths (honeypot/admin areas)
  RAPID_REQUESTS: 20, // Too many requests in short time
  REPEATED_ERRORS: 15, // Repeated 404s or errors
  UNUSUAL_PATTERN: 25, // Unusual access pattern
  NONEXISTENT_RESOURCES: 10, // Requesting resources that don't exist
  REQUEST_CONSISTENCY: 20, // Consistency in request patterns
  MULTIPLE_SENSITIVE_HITS: 40, // Multiple hits to different sensitive paths
  RESOURCE_TIMING: 25, // Abnormal timing between resource requests (increased from 15)
  SESSION_ANOMALY: 30, // Suspicious session behavior
}

// Traffic classification - helps distinguish between different user types
export enum TrafficType {
  REGULAR_USER = 'regular_user',
  SUSPICIOUS = 'suspicious_bot',
  MALICIOUS_BOT = 'malicious_bot',
  UNKNOWN = 'unknown',
}

// Enhanced session data with more behavioral indicators
export interface SessionData {
  lastRequests: Array<{
    timestamp: number
    path: string
    status?: number
    timeSincePrevious?: number
    method?: string
  }>
  suspiciousPathHits: number
  maybeSensitivePathHits: number
  uniqueSensitivePathsAccessed: string[] // Track unique sensitive paths accessed
  errorCount: number
  score: number
  lastScore: number
  lastUpdated: number
  trafficType: TrafficType
  knownGoodActions: number // Count of actions that indicate human behavior
  tempExemptUntil?: number // Timestamp for temporary exemption
  requestMethodVariety: string[] // Array of used HTTP methods
  averageTimeBetweenRequests?: number
  requestSequenceEntropy: number // Measure of randomness in request sequence
  firstSeenAt: number // When the session was first created
  behaviorChangePoints?: number[] // Timestamps where behavior significantly changed
}

export interface IPData {
  sessionCount: number
  activeSessions: string[] // Track active session IDs
  suspiciousScore: number
  lastUpdated: number
  legitSessionsCount: number // Count of sessions that passed human verification
  sessionsPerHour?: number // Rate of new sessions creation
  lastSessionCreated?: number // Timestamp of the last session created+
  isBot?: boolean
  isBotConfidence?: number
  details?: { name: string, type: string, trusted?: boolean } | null
  factores: string[] // List of factors that contributed to the score
}

// Helper to check if path is in the maybe-sensitive category
export function isMaybeSensitivePath(path: string): boolean {
  return MAYBE_SENSITIVE_PATHS.some(sp => path.includes(sp))
}

// Calculate entropy of request sequences to detect non-human patterns
function calculateRequestEntropy(paths: string[]): number {
  if (paths.length < 3)
    return 0

  // Count occurrences of each path
  const pathCounts: Record<string, number> = {}
  for (const path of paths) {
    pathCounts[path] = (pathCounts[path] || 0) + 1
  }

  // Calculate entropy
  let entropy = 0
  const totalPaths = paths.length

  for (const path in pathCounts) {
    const probability = pathCounts[path] / totalPaths
    entropy -= probability * Math.log2(probability)
  }

  return entropy
}

// Detect if a request sequence matches natural browsing patterns
function analyzeRequestSequence(requests: Array<{ path: string, timestamp: number }>): {
  isNaturalBrowsing: boolean
  entropy: number
  timeConsistency: number
} {
  if (requests.length < 5) {
    return { isNaturalBrowsing: true, entropy: 0, timeConsistency: 1 }
  }

  // 1. Check time intervals between requests
  const intervals: number[] = []

  // Sort requests by timestamp (oldest to newest) for interval calculation
  const sortedRequests = [...requests].sort((a, b) => a.timestamp - b.timestamp)

  for (let i = 1; i < sortedRequests.length; i++) {
    intervals.push(sortedRequests[i].timestamp - sortedRequests[i - 1].timestamp)
  }

  // Calculate variance in intervals
  const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length
  const variance = intervals.reduce((sum, val) => sum + (val - avgInterval) ** 2, 0) / intervals.length

  // Natural browsing has some variance in timing
  const timeConsistency = Math.min(1, variance / (avgInterval * avgInterval))

  // 2. Calculate path entropy
  const paths = requests.map(r => r.path)
  const entropy = calculateRequestEntropy(paths)

  // 3. Multiple indicators of unnatural browsing patterns
  let suspiciousPatternCount = 0

  // A. Check for alphabetical or sequential scanning patterns
  const pathsInOrder = sortedRequests.map(r => r.path)
  let sequentialOrdering = true

  for (let i = 1; i < pathsInOrder.length; i++) {
    // If paths don't progress in a way that suggests scanning, it's more natural
    if (pathsInOrder[i].localeCompare(pathsInOrder[i - 1]) < 0) {
      sequentialOrdering = false
      break
    }
  }

  if (sequentialOrdering && pathsInOrder.length >= 4) {
    suspiciousPatternCount++
  }

  // B. Check for common prefix patterns (like crawling similar endpoints)
  const pathPrefixes = new Map<string, number>()
  for (const path of paths) {
    // Extract the first segment of the path (e.g., "/admin" from "/admin/users")
    const prefix = `/${path.split('/')[1]}`
    pathPrefixes.set(prefix, (pathPrefixes.get(prefix) || 0) + 1)
  }

  // If 80% of requests are to the same prefix, it's suspicious
  for (const [, count] of pathPrefixes.entries()) {
    if (count >= Math.ceil(paths.length * 0.8) && paths.length >= 4) {
      suspiciousPatternCount++
      break
    }
  }

  // C. Look for numeric incrementation patterns in paths (like id scanning)
  const hasNumericPattern = paths.some((path) => {
    const matches = path.match(/(\d+)/g)
    return matches && matches.length > 0
  })

  if (hasNumericPattern) {
    let numericSequential = true
    const numericValues: number[] = []

    // Extract numeric values from paths
    for (const path of pathsInOrder) {
      const matches = path.match(/(\d+)/g)
      if (matches && matches.length > 0) {
        numericValues.push(Number.parseInt(matches[0], 10))
      }
      else {
        numericSequential = false
        break
      }
    }

    // Check if numeric values are sequential or have a pattern
    if (numericSequential && numericValues.length >= 3) {
      let hasPattern = true
      const diff = numericValues[1] - numericValues[0]

      for (let i = 2; i < numericValues.length; i++) {
        if (numericValues[i] - numericValues[i - 1] !== diff) {
          hasPattern = false
          break
        }
      }

      if (hasPattern) {
        suspiciousPatternCount++
      }
    }
  }

  // D. Check for consistent path length/structure (indicative of automation)
  const pathLengths = paths.map(p => p.length)
  const avgLength = pathLengths.reduce((sum, len) => sum + len, 0) / pathLengths.length
  const lengthVariance = pathLengths.reduce((sum, len) => sum + (len - avgLength) ** 2, 0) / pathLengths.length

  // If path lengths are very consistent, it's suspicious
  if (Math.sqrt(lengthVariance) / avgLength < 0.1 && paths.length >= 4) {
    suspiciousPatternCount++
  }

  // Combine indicators to determine if this is natural browsing
  const isNaturalBrowsing = (
    // Either high entropy (varied paths) and some time variance
    (entropy > 1.5 && timeConsistency > 0.2)
    // Or no suspicious patterns detected
    || suspiciousPatternCount === 0
  )

  return {
    isNaturalBrowsing,
    entropy,
    timeConsistency,
  }
}

// Helper function to identify adaptive rate limits based on client history
function calculateRateLimit(sessionData: SessionData): number {
  // Base rate limit - start with a moderate default
  let rateLimit = 15 // requests per minute

  // Adjust based on client behavior
  if (sessionData.trafficType === TrafficType.REGULAR_USER) {
    // Regular users can have higher bursts during normal browsing
    rateLimit = 30
  }
  else if (sessionData.suspiciousPathHits > 0) {
    // Clients that hit suspicious paths get stricter limits
    rateLimit = Math.max(5, rateLimit - sessionData.suspiciousPathHits * 2)
  }

  // Adjust for known good behavior
  if (sessionData.knownGoodActions > 5) {
    // Clients with good history get more flexibility
    rateLimit += Math.min(20, sessionData.knownGoodActions)
  }

  return rateLimit
}

// Detect potential session hijacking or cookie theft
function detectSessionAnomaly(ipData: IPData, sessionData: SessionData, timestamp: number = Date.now()): {
  suspicious: boolean
  severity: number
  reason?: string
} {
  const result = {
    suspicious: false,
    severity: 0,
    reason: '',
  }

  const SESSION_AGE_THRESHOLD = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  const now = timestamp

  // Check for IP with many sessions
  if (ipData.activeSessions.length > 10) {
    result.suspicious = true
    result.severity = Math.min(70, ipData.activeSessions.length * 5)
    result.reason = 'MANY_SESSIONS'
    return result
  }

  // Check for high session creation rate
  if (ipData.sessionsPerHour && ipData.sessionsPerHour > 5) {
    result.suspicious = true
    result.severity = Math.min(60, ipData.sessionsPerHour * 10)
    result.reason = 'RAPID_SESSION_CREATION'
    return result
  }

  // Check for abrupt behavior changes in old sessions
  if (sessionData.firstSeenAt && (now - sessionData.firstSeenAt > SESSION_AGE_THRESHOLD)) {
    // Old session with sudden suspicious activity
    if (sessionData.suspiciousPathHits > 0 && sessionData.lastRequests.length > 5) {
      // Check if suspicious behavior started recently
      const recentRequests = sessionData.lastRequests.slice(-5)
      const olderRequests = sessionData.lastRequests.slice(0, -5)

      // Calculate scores for both segments
      const recentSuspicious = recentRequests.filter(r =>
        SENSITIVE_PATHS.some(sp => r.path.includes(sp))
        || MAYBE_SENSITIVE_PATHS.some(sp => r.path.includes(sp)),
      ).length

      const olderSuspicious = olderRequests.filter(r =>
        SENSITIVE_PATHS.some(sp => r.path.includes(sp))
        || MAYBE_SENSITIVE_PATHS.some(sp => r.path.includes(sp)),
      ).length

      // If recent behavior is much more suspicious than older behavior
      if (recentSuspicious > 0 && (olderSuspicious === 0 || recentSuspicious / olderRequests.length > olderSuspicious / olderRequests.length * 3)) {
        result.suspicious = true
        result.severity = 50
        result.reason = 'BEHAVIOR_CHANGE'

        // Mark this point as a behavior change point
        if (!sessionData.behaviorChangePoints) {
          sessionData.behaviorChangePoints = []
        }
        sessionData.behaviorChangePoints.push(now)
      }
    }
  }

  return result
}

export interface DetectionFactor {
  type: string
  weight: number
  evidence: any
  timestamp: number
  description: string
}

export interface DebugInfo {
  sessionAge: number
  requestCount: number
  pathHistory: string[]
  timingAnalysis: {
    avgInterval: number
    consistency: number
    entropy: number
  }
  factors: DetectionFactor[]
  ipInfo: {
    sessionCount: number
    totalScore: number
    isBlocked: boolean
    isTrusted: boolean
  }
  confidence: number
  reasoning: string[]
}

export interface BotDetectionBehavior {
  id: string
  session: SessionData
  ip: IPData
  dirty?: boolean
  debug?: DebugInfo
}

export function analyzeSessionAndIpBehavior({
  event,
  behavior,
  timestamp = Date.now(),
  debug = false,
}: {
  event: H3Event
  behavior: BotDetectionBehavior
  timestamp?: number
  debug?: boolean
}) {
  initializeBehaviorConfig()
  
  const path = event.path || ''
  const method = event.method || 'GET'
  // Check if this is a maybe-sensitive path
  const isMaybeSensitive = isMaybeSensitivePath(path)
  const now = timestamp

  // Initialize or get session data with improved defaults
  const sessionData: SessionData = behavior.session

  // Initialize or get IP data with improved defaults
  const ipData: IPData = behavior.ip

  // Initialize debug tracking
  const detectionFactors: DetectionFactor[] = []
  const reasoning: string[] = []
  
  function addFactor(type: string, weight: number, evidence: any, description: string) {
    const factor: DetectionFactor = {
      type,
      weight,
      evidence,
      timestamp: now,
      description
    }
    detectionFactors.push(factor)
    if (debug) {
      reasoning.push(`${type}: ${description} (weight: ${weight})`)
    }
    return weight
  }

  // Calculate scoring factors
  const scoreFactors: Record<string, number> = {}

  // Check for maybe-sensitive path access
  if (isMaybeSensitive) {
    sessionData.maybeSensitivePathHits = (sessionData.maybeSensitivePathHits || 0) + 1

    // Track unique sensitive paths for detecting scanning behavior
    sessionData.uniqueSensitivePathsAccessed = sessionData.uniqueSensitivePathsAccessed || []
    if (!sessionData.uniqueSensitivePathsAccessed.includes(path)) {
      sessionData.uniqueSensitivePathsAccessed.push(path)
    }

    // Apply score - smaller penalty for first hit, larger for repeated behavior
    if (sessionData.maybeSensitivePathHits === 1) {
      scoreFactors.MAYBE_SENSITIVE_PATH = addFactor(
        'MAYBE_SENSITIVE_PATH', 
        BEHAVIOR_WEIGHTS.MAYBE_SENSITIVE_PATH,
        { path, hitCount: 1 },
        `First access to potentially sensitive path: ${path}`
      )
    }
    else if (sessionData.maybeSensitivePathHits > 1) {
      // Multiple hits to sensitive paths is more suspicious
      const weight = BEHAVIOR_WEIGHTS.MAYBE_SENSITIVE_PATH * Math.min(3, sessionData.maybeSensitivePathHits)
      scoreFactors.MAYBE_SENSITIVE_PATH = addFactor(
        'MAYBE_SENSITIVE_PATH',
        weight,
        { path, hitCount: sessionData.maybeSensitivePathHits },
        `Multiple access to sensitive paths (${sessionData.maybeSensitivePathHits} hits)`
      )

      // If they hit multiple different sensitive paths, that's even more suspicious
      if (sessionData.uniqueSensitivePathsAccessed.length >= 2) {
        scoreFactors.MULTIPLE_SENSITIVE_HITS = addFactor(
          'MULTIPLE_SENSITIVE_HITS',
          BEHAVIOR_WEIGHTS.MULTIPLE_SENSITIVE_HITS,
          { uniquePaths: sessionData.uniqueSensitivePathsAccessed },
          `Scanning behavior: ${sessionData.uniqueSensitivePathsAccessed.length} different sensitive paths`
        )
      }
    }
  }

  // Calculate time since previous request if applicable
  let timeSincePrevious = 0
  if (sessionData.lastRequests.length > 0) {
    timeSincePrevious = now - sessionData.lastRequests[sessionData.lastRequests.length - 1].timestamp
  }

  // Track this request with enhanced metadata
  sessionData.lastRequests.push({
    timestamp: now,
    path,
    method,
    timeSincePrevious,
  })

  // Track HTTP method variety
  if (!sessionData.requestMethodVariety.includes(method)) {
    sessionData.requestMethodVariety.push(method)
  }

  // Only keep last 30 requests for better pattern analysis
  if (sessionData.lastRequests.length > 30) {
    sessionData.lastRequests.shift()
  }

  // Apply time decay to previous scores (reduce by ~10% per hour)
  const hoursSinceLastUpdate = (now - sessionData.lastUpdated) / (1000 * 60 * 60)
  if (hoursSinceLastUpdate > 0) {
    sessionData.score = Math.max(0, sessionData.score * 0.9 ** hoursSinceLastUpdate)
  }

  // Associate this session with the IP if not already tracked
  if (!ipData.activeSessions.includes(behavior.id)) {
    ipData.activeSessions.push(behavior.id)
    ipData.sessionCount = ipData.activeSessions.length

    // Calculate session creation rate
    if (ipData.lastSessionCreated) {
      const hoursSinceLastSession = (now - ipData.lastSessionCreated) / (1000 * 60 * 60)

      if (hoursSinceLastSession < 1) {
        // If creating sessions more than once per hour, track the rate
        ipData.sessionsPerHour = ipData.sessionsPerHour
          ? (ipData.sessionsPerHour * 0.7 + (1 / hoursSinceLastSession) * 0.3) // Weighted average
          : (1 / hoursSinceLastSession)
      }
    }
    ipData.lastSessionCreated = now
  }

  // 1. Check for sensitive path access
  if (SENSITIVE_PATHS.some(sensitivePath => path.includes(sensitivePath))) {
    sessionData.suspiciousPathHits++
    scoreFactors.SENSITIVE_PATH = addFactor(
      'SENSITIVE_PATH',
      BEHAVIOR_WEIGHTS.SENSITIVE_PATH,
      { path, hitCount: sessionData.suspiciousPathHits },
      `Access to highly sensitive path: ${path}`
    )
  }

  // 2. Check for rapid requests with adaptive rate limiting
  const oneMinuteAgo = now - 60000
  const requestsLastMinute = sessionData.lastRequests.filter(req => req.timestamp > oneMinuteAgo).length
  const adaptiveRateLimit = calculateRateLimit(sessionData)

  if (requestsLastMinute > adaptiveRateLimit) {
    // Apply score proportional to how much the limit was exceeded
    const overageRatio = requestsLastMinute / adaptiveRateLimit
    const weight = Math.min(
      BEHAVIOR_WEIGHTS.RAPID_REQUESTS * overageRatio,
      BEHAVIOR_WEIGHTS.RAPID_REQUESTS * 2, // Cap at double the weight
    )
    scoreFactors.RAPID_REQUESTS = addFactor(
      'RAPID_REQUESTS',
      weight,
      { requestsLastMinute, rateLimit: adaptiveRateLimit, overageRatio },
      `Too many requests: ${requestsLastMinute}/${adaptiveRateLimit} (${Math.round(overageRatio * 100)}% over limit)`
    )
  }

  // 3. Analyze request sequence for natural browsing patterns
  if (sessionData.lastRequests.length >= 5) {
    const sequenceAnalysis = analyzeRequestSequence(sessionData.lastRequests)
    sessionData.requestSequenceEntropy = sequenceAnalysis.entropy

    if (!sequenceAnalysis.isNaturalBrowsing) {
      scoreFactors.UNUSUAL_PATTERN = BEHAVIOR_WEIGHTS.UNUSUAL_PATTERN
        * (1 - Math.min(1, sequenceAnalysis.entropy / 2))
    }
    else {
      // Reduce score for natural browsing patterns - positive reinforcement
      sessionData.score = Math.max(0, sessionData.score - 5)
      sessionData.knownGoodActions += 1
    }
  }

  // 4. Check for session anomaly - add anomaly detection logic here
  const sessionAnomaly = detectSessionAnomaly(ipData, sessionData, timestamp)
  if (sessionAnomaly.suspicious) {
    scoreFactors.SESSION_ANOMALY = Math.min(
      BEHAVIOR_WEIGHTS.SESSION_ANOMALY,
      sessionAnomaly.severity,
    )
  }

  // 5. Check request timing consistency
  // Bots often have very consistent intervals between requests
  if (sessionData.lastRequests.length > 5) {
    // Only analyze the existing requests, not including the one just added
    // This prevents the new request from breaking the pattern analysis
    const existingRequests = sessionData.lastRequests.slice(0, -1)

    // Extract intervals only from requests that have a valid timeSincePrevious value
    const intervals: number[] = []
    for (let i = 0; i < existingRequests.length; i++) {
      const timeSincePrevious = existingRequests[i]?.timeSincePrevious
      if (timeSincePrevious && timeSincePrevious > 0) {
        intervals.push(timeSincePrevious)
      }
    }

    // Only proceed if we have enough intervals to analyze
    if (intervals.length >= 4) {
      // Calculate mean and standard deviation
      const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length
      const variance = intervals.reduce((sum, val) => sum + (val - mean) ** 2, 0) / intervals.length
      const stdDev = Math.sqrt(variance)

      // Very low standard deviation indicates suspiciously consistent timing
      const coefficientOfVariation = stdDev / mean

      // Enhanced scoring logic with multiple tiers of suspicion:

      // Extremely precise timing (practically impossible for humans)
      if (coefficientOfVariation < 0.05 && intervals.length >= 5) {
        // This is absolutely a bot - humans cannot maintain this precision
        scoreFactors.RESOURCE_TIMING = BEHAVIOR_WEIGHTS.RESOURCE_TIMING * 3 // Triple the weight

        // If very fast as well (sub-second), even more suspicious
        if (mean < 1000) {
          scoreFactors.RESOURCE_TIMING += 15 // Additional penalty for inhuman speed
        }
      }
      // Very suspicious timing
      else if (coefficientOfVariation < 0.1 && mean < 2000) {
        // Highly suspicious but not impossible
        scoreFactors.RESOURCE_TIMING = BEHAVIOR_WEIGHTS.RESOURCE_TIMING * 2 // Double the weight
      }
      // Somewhat suspicious timing
      else if (coefficientOfVariation < 0.2 && mean < 3000) {
        // Still suspicious but less so
        scoreFactors.RESOURCE_TIMING = BEHAVIOR_WEIGHTS.RESOURCE_TIMING
      }

      // Update average time between requests for future analysis
      sessionData.averageTimeBetweenRequests = mean
    }
  }

  // Add up all score factors
  const additionalScore = Object.values(scoreFactors).reduce((sum, val) => sum + val, 0)
  sessionData.score += additionalScore

  // Update traffic type classification based on score
  if (sessionData.score >= BOT_SCORE_THRESHOLDS.DEFINITELY_BOT) {
    sessionData.trafficType = TrafficType.MALICIOUS_BOT
  }
  else if (sessionData.score >= BOT_SCORE_THRESHOLDS.LIKELY_BOT) {
    sessionData.trafficType = TrafficType.SUSPICIOUS
  }
  else if (sessionData.score >= BOT_SCORE_THRESHOLDS.SUSPICIOUS) {
    sessionData.trafficType = TrafficType.SUSPICIOUS
  }
  else {
    sessionData.trafficType = TrafficType.REGULAR_USER
  }

  // Cap score at 100
  sessionData.score = Math.min(100, sessionData.score)

  // Update IP score based on session score with memory effect
  // This allows the IP to be marked as suspicious based on behavior across multiple sessions
  ipData.suspiciousScore = Math.max(
    ipData.suspiciousScore * 0.9, // Decay previous score
    sessionData.score * 0.8, // Influence from current session
  )

  // Increment legitimate session count if this seems to be a real user
  if (sessionData.score <= BOT_SCORE_THRESHOLDS.PROBABLY_HUMAN
    && sessionData.knownGoodActions >= 3) {
    ipData.legitSessionsCount++

    // If an IP has many legitimate sessions, gradually reduce its suspicious score
    if (ipData.legitSessionsCount > 5 && ipData.suspiciousScore > 0) {
      ipData.suspiciousScore = Math.max(0, ipData.suspiciousScore - 5)
    }
  }

  // Save data back to storage
  sessionData.lastUpdated = now
  ipData.lastUpdated = now

  behavior.ip.isBot = sessionData.score >= BOT_SCORE_THRESHOLDS.LIKELY_BOT
  behavior.ip.isBotConfidence = (sessionData.score + ipData.suspiciousScore) / 2

  behavior.session = sessionData
  behavior.ip = ipData
  
  // Add debug information if requested
  if (debug) {
    const sessionAge = now - sessionData.firstSeenAt
    const avgInterval = sessionData.lastRequests.length > 1 
      ? sessionData.lastRequests.reduce((sum, req, i) => {
          if (i === 0) return 0
          return sum + (req.timestamp - sessionData.lastRequests[i-1].timestamp)
        }, 0) / (sessionData.lastRequests.length - 1)
      : 0
    
    behavior.debug = {
      sessionAge,
      requestCount: sessionData.lastRequests.length,
      pathHistory: sessionData.lastRequests.map(r => r.path),
      timingAnalysis: {
        avgInterval,
        consistency: sessionData.requestSequenceEntropy,
        entropy: sessionData.requestSequenceEntropy
      },
      factors: detectionFactors,
      ipInfo: {
        sessionCount: ipData.sessionCount,
        totalScore: ipData.suspiciousScore,
        isBlocked: false, // TODO: get from IP checking
        isTrusted: false  // TODO: get from IP checking
      },
      confidence: behavior.ip.isBotConfidence || 0,
      reasoning
    }
  }
}

// Enhanced bot detection with improved behavior analysis

// Update bot score after request completion (to account for status codes)
export function applyBehaviorForErrorPages(
  event: H3Event,
  behavior: BotDetectionBehavior,
) {
  const sessionData = behavior.session!
  const status = getResponseStatus(event)

  // Update the last request with the status code
  if (sessionData.lastRequests.length > 0) {
    sessionData.lastRequests[sessionData.lastRequests.length - 1].status = status
  }

  // Count errors (404s, 403s, etc.)
  if (status >= 400) {
    sessionData.errorCount++

    // Add score for repeated errors with progressive penalty
    if (sessionData.errorCount > 2) {
      // Apply increasing penalty for each error after the first few
      const errorPenalty = Math.min(
        BEHAVIOR_WEIGHTS.REPEATED_ERRORS,
        BEHAVIOR_WEIGHTS.REPEATED_ERRORS * (sessionData.errorCount - 2) / 5,
      )
      sessionData.score += errorPenalty

      // Check for consecutive errors
      const recentRequests = sessionData.lastRequests.slice(-5)
      const consecutiveErrors = recentRequests.filter(req => req.status && req.status >= 400).length

      if (consecutiveErrors >= 3) {
        // Strong bot signal: consecutive errors
        sessionData.score += BEHAVIOR_WEIGHTS.REPEATED_ERRORS

        // If a session shows significant behavior changes, make note of this
        if (!sessionData.behaviorChangePoints) {
          sessionData.behaviorChangePoints = []
        }

        // If we have a consecutive error pattern, consider this a behavior change point
        sessionData.behaviorChangePoints.push(Date.now())
      }
    }

    // 404s might indicate scanning for vulnerabilities
    if (status === 404) {
      // Apply smaller penalty for resource 404s
      sessionData.score += BEHAVIOR_WEIGHTS.NONEXISTENT_RESOURCES * 0.3
    }

    // Cap score at 100
    sessionData.score = Math.min(100, sessionData.score)

    // Update traffic type if needed
    if (sessionData.score >= BOT_SCORE_THRESHOLDS.DEFINITELY_BOT) {
      sessionData.trafficType = TrafficType.MALICIOUS_BOT
    }
    else if (sessionData.score >= BOT_SCORE_THRESHOLDS.LIKELY_BOT) {
      sessionData.trafficType = TrafficType.SUSPICIOUS
    }
  }
  else if (status >= 200 && status < 300) {
    // Successful requests may indicate legitimate use
    // Especially 2xx on HTML pages
    // Slightly reduce score for successful HTML page views
    sessionData.score = Math.max(0, sessionData.score - 1)
    sessionData.knownGoodActions += 0.5
  }

  // Update IP storage if the score changed significantly
  if (Math.abs(sessionData.score - (sessionData.lastScore || 0)) > 10) {
    if (behavior.ip) {
      // If this session suddenly became very suspicious, update IP score immediately
      if (sessionData.score >= BOT_SCORE_THRESHOLDS.LIKELY_BOT
        && (sessionData.lastScore || 0) < BOT_SCORE_THRESHOLDS.SUSPICIOUS) {
        behavior.ip.suspiciousScore = Math.max(behavior.ip.suspiciousScore, sessionData.score * 0.8)
      }
    }

    // Remember the last score for future comparisons
    sessionData.lastScore = sessionData.score
  }
}
