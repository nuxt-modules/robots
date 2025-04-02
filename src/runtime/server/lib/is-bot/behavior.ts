// src/runtime/server/lib/botd.ts
import type { getHeaders, H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'
import { useSession } from 'h3'

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

// Enhanced bot detection score thresholds with an intermediate level
export const BOT_SCORE_THRESHOLDS = {
  DEFINITELY_BOT: 90,
  LIKELY_BOT: 70,
  SUSPICIOUS: 40,
  PROBABLY_HUMAN: 20,
  DEFINITELY_HUMAN: 5,
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
  whitelisted: boolean
  blacklisted: boolean
  legitSessionsCount: number // Count of sessions that passed human verification
  sessionsPerHour?: number // Rate of new sessions creation
  lastSessionCreated?: number // Timestamp of the last session created
}

// More sophisticated HTML path detection
export function isLikelyHtmlPath(path: string, headers?: Record<string, string>): boolean {
  // Parse accept header properly with quality values
  if (headers?.accept) {
    // Check if HTML is explicitly in the accept header with priority
    const acceptTypes = headers.accept.split(',')
    for (const type of acceptTypes) {
      const [mimeType, quality] = type.split(';')
      const trimmedType = mimeType.trim()

      // If html is explicitly requested with high quality value
      if ((trimmedType === 'text/html' || trimmedType === 'application/xhtml+xml')
        && (!quality || Number.parseFloat(quality.replace('q=', '')) > 0.5)) {
        return true
      }
    }

    // If accept header exists but doesn't prioritize HTML, check it against typical API/asset patterns
    if (headers.accept.includes('application/json')
      || headers.accept.includes('image/')
      || headers.accept === '*/*') {
      // Probably not an HTML request
      return false
    }
  }

  // Check common URL patterns that indicate non-HTML resources
  // Skip common non-HTML file extensions
  const nonHtmlExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
    '.ico',
    '.css',
    '.js',
    '.json',
    '.map',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
    '.mp4',
    '.webm',
    '.mp3',
    '.wav',
    '.pdf',
    '.xml',
    '.zip',
    '.gz',
    '.tar',
    '.wasm',
    '.avif',
    '.heic',
    '.webmanifest',
    '.txt',
  ]

  // Check if path ends with a non-HTML extension
  const pathLower = path.toLowerCase()
  if (nonHtmlExtensions.some(ext => pathLower.endsWith(ext))) {
    return false
  }

  // Check for API endpoints or static asset paths which aren't typically HTML
  const nonHtmlPatterns = [
    '/api/',
    '/_nuxt/',
    '/_next/',
    '/assets/',
    '/static/',
    '/img/',
    '/images/',
    '/media/',
    '/fonts/',
    '/dist/',
    '/public/',
    '/cdn/',
    '/uploads/',
    '/scripts/',
    '/styles/',
  ]

  if (nonHtmlPatterns.some(pattern => pathLower.includes(pattern))) {
    return false
  }

  // Look for query parameters that suggest non-HTML responses
  if (path.includes('?')
    && (path.includes('format=json')
      || path.includes('output=json')
      || path.includes('.json'))) {
    return false
  }

  // Default to treating it as HTML if no specific non-HTML indicators are present
  // especially paths with no extension or paths ending in / which are likely pages
  return true
}

export async function useBotDetectionSession(event: H3Event) {
  const config = useRuntimeConfig()
  return await useSession(event, {
    password: config.robots.botDetectionSecret || '80d42cfb-1cd2-462c-8f17-e3237d9027e9',
  })
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

export async function analyzeBotBehavior({
  ip,
  path,
  method,
  storage,
  session,
  headers,
  timestamp = Date.now(),
}: {
  ip: string
  path: string
  method: string
  storage: any // The kvStorage interface
  session: { id: string }
  headers: ReturnType<typeof getHeaders>
  timestamp?: number
}) {
  // Check if this is an HTML path - if not, skip extensive bot detection
  const isHtmlPath = isLikelyHtmlPath(path, { accept: headers.accept || '' })

  // Check if this is a maybe-sensitive path
  const isMaybeSensitive = isMaybeSensitivePath(path)
  const now = timestamp
  const sessionKey = `session:${session.id}`
  const ipKey = `ip:${ip}`

  // Initialize or get session data with improved defaults
  const sessionData: SessionData = await storage.getItem(sessionKey) || {
    lastRequests: [],
    suspiciousPathHits: 0,
    maybeSensitivePathHits: 0,
    uniqueSensitivePathsAccessed: [],
    errorCount: 0,
    score: 0,
    lastUpdated: now,
    trafficType: TrafficType.UNKNOWN,
    knownGoodActions: 0,
    requestMethodVariety: [],
    requestSequenceEntropy: 0,
    firstSeenAt: now,
  }

  // Initialize or get IP data with improved defaults
  const ipData: IPData = await storage.getItem(ipKey) || {
    sessionCount: 0,
    activeSessions: [],
    suspiciousScore: 0,
    lastUpdated: now,
    whitelisted: false,
    blacklisted: false,
    legitSessionsCount: 0,
    lastSessionCreated: now,
  }

  // Check for whitelist/blacklist
  if (ipData.whitelisted) {
    return {
      score: 0,
      ipScore: 0,
      isLikelyBot: false,
      factors: {},
      session: session.id,
      ip,
      whitelisted: true,
    }
  }

  if (ipData.blacklisted) {
    return {
      score: 100,
      ipScore: 100,
      isLikelyBot: true,
      factors: { BLACKLISTED: 100 },
      session: session.id,
      ip,
      blacklisted: true,
    }
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
      scoreFactors.MAYBE_SENSITIVE_PATH = BEHAVIOR_WEIGHTS.MAYBE_SENSITIVE_PATH
    }
    else if (sessionData.maybeSensitivePathHits > 1) {
      // Multiple hits to sensitive paths is more suspicious
      scoreFactors.MAYBE_SENSITIVE_PATH = BEHAVIOR_WEIGHTS.MAYBE_SENSITIVE_PATH
        * Math.min(3, sessionData.maybeSensitivePathHits)

      // If they hit multiple different sensitive paths, that's even more suspicious
      if (sessionData.uniqueSensitivePathsAccessed.length >= 2) {
        scoreFactors.MULTIPLE_SENSITIVE_HITS = BEHAVIOR_WEIGHTS.MULTIPLE_SENSITIVE_HITS
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

  // For non-HTML paths, only do minimal processing
  if (!isHtmlPath && !isMaybeSensitive) {
    // Still save the request data for context
    sessionData.lastUpdated = now
    // await storage.setItem(sessionKey, sessionData, {
    //   ttl: 60 * 60 * 24, // 24 hour TTL
    // })

    // Associate this session with the IP if not already tracked
    if (!ipData.activeSessions.includes(session.id)) {
      ipData.activeSessions.push(session.id)
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

      // await storage.setItem(ipKey, ipData, {
      //   ttl: 60 * 60 * 24 * 7, // 7 day TTL for IP data
      // })
    }

    // Return current scores without additional processing
    return {
      score: sessionData.score,
      ipScore: ipData.suspiciousScore,
      isLikelyBot: sessionData.score >= BOT_SCORE_THRESHOLDS.LIKELY_BOT,
      factors: {},
      session: session.id,
      ip,
      skippedProcessing: true,
    }
  }

  // Apply time decay to previous scores (reduce by ~10% per hour)
  const hoursSinceLastUpdate = (now - sessionData.lastUpdated) / (1000 * 60 * 60)
  if (hoursSinceLastUpdate > 0) {
    sessionData.score = Math.max(0, sessionData.score * 0.9 ** hoursSinceLastUpdate)
  }

  // Associate this session with the IP if not already tracked
  if (!ipData.activeSessions.includes(session.id)) {
    ipData.activeSessions.push(session.id)
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
    scoreFactors.SENSITIVE_PATH = BEHAVIOR_WEIGHTS.SENSITIVE_PATH
  }

  // 2. Check for rapid requests with adaptive rate limiting
  const oneMinuteAgo = now - 60000
  const requestsLastMinute = sessionData.lastRequests.filter(req => req.timestamp > oneMinuteAgo).length
  const adaptiveRateLimit = calculateRateLimit(sessionData)

  if (requestsLastMinute > adaptiveRateLimit) {
    // Apply score proportional to how much the limit was exceeded
    const overageRatio = requestsLastMinute / adaptiveRateLimit
    scoreFactors.RAPID_REQUESTS = Math.min(
      BEHAVIOR_WEIGHTS.RAPID_REQUESTS * overageRatio,
      BEHAVIOR_WEIGHTS.RAPID_REQUESTS * 2, // Cap at double the weight
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
    const intervals = []
    for (let i = 0; i < existingRequests.length; i++) {
      if (existingRequests[i].timeSincePrevious && existingRequests[i].timeSincePrevious > 0) {
        intervals.push(existingRequests[i].timeSincePrevious)
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
  else if (sessionData.score <= BOT_SCORE_THRESHOLDS.PROBABLY_HUMAN) {
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

  // Return enhanced bot detection result
  return {
    score: sessionData.score,
    ipScore: ipData.suspiciousScore,
    isLikelyBot: sessionData.score >= BOT_SCORE_THRESHOLDS.LIKELY_BOT,
    factors: scoreFactors,
    trafficType: sessionData.trafficType,
    session: session.id,
    ip,
    sensitivePaths: sessionData.uniqueSensitivePathsAccessed || [],
    requestEntropy: sessionData.requestSequenceEntropy,
    legitActions: sessionData.knownGoodActions,
    sessionAge: now - sessionData.firstSeenAt,
    behaviorChanges: sessionData.behaviorChangePoints?.length || 0,
    ipKey,
    ipData,
    sessionKey,
    sessionData,
  }
}

// Enhanced bot detection with improved behavior analysis

// Update bot score after request completion (to account for status codes)
export async function updateBotScoreAfterRequest(event: H3Event, status: number, storage: any, session, any) {
  const sessionData: SessionData | null = await kvStorage.getItem(sessionKey)
  if (!sessionData)
    return

  // Update the last request with the status code
  if (sessionData.lastRequests.length > 0) {
    sessionData.lastRequests[sessionData.lastRequests.length - 1].status = status
  }

  // For non-HTML paths, just update the status code without scoring
  const headers = getHeaders(event)
  const acceptHeader = headers.accept || ''
  if (!isLikelyHtmlPath(path, { accept: acceptHeader }) && !isMaybeSensitivePath(path)) {
    await kvStorage.setItem(sessionKey, sessionData)
    return
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
      const pathIsCommonResource = path.endsWith('.js')
        || path.endsWith('.css')
        || path.includes('/images/')
        || path.includes('/assets/')

      // Don't penalize 404s on common resource paths as much (could be stale cache or changed resource names)
      if (!pathIsCommonResource) {
        sessionData.score += BEHAVIOR_WEIGHTS.NONEXISTENT_RESOURCES
      }
      else {
        // Apply smaller penalty for resource 404s
        sessionData.score += BEHAVIOR_WEIGHTS.NONEXISTENT_RESOURCES * 0.3
      }
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

    // Save updated data
    await kvStorage.setItem(sessionKey, sessionData)
  }
  else if (status >= 200 && status < 300) {
    // Successful requests may indicate legitimate use
    // Especially 2xx on HTML pages
    if (isLikelyHtmlPath(path, { accept: acceptHeader })) {
      // Slightly reduce score for successful HTML page views
      sessionData.score = Math.max(0, sessionData.score - 1)
      sessionData.knownGoodActions += 0.5
      await kvStorage.setItem(sessionKey, sessionData)
    }
  }

  // Update IP storage if the score changed significantly
  if (Math.abs(sessionData.score - (sessionData.lastScore || 0)) > 10) {
    const ip = getRequestIP(event)
    const ipKey = `ip:${ip}`
    const ipData: IPData | null = await kvStorage.getItem(ipKey)

    if (ipData) {
      // If this session suddenly became very suspicious, update IP score immediately
      if (sessionData.score >= BOT_SCORE_THRESHOLDS.LIKELY_BOT
        && (sessionData.lastScore || 0) < BOT_SCORE_THRESHOLDS.SUSPICIOUS) {
        ipData.suspiciousScore = Math.max(ipData.suspiciousScore, sessionData.score * 0.8)
        await kvStorage.setItem(ipKey, ipData, {
          ttl: 60 * 60 * 24 * 7, // 7 day TTL for IP data
        })
      }
    }

    // Remember the last score for future comparisons
    sessionData.lastScore = sessionData.score
    await kvStorage.setItem(sessionKey, sessionData)
  }
}
