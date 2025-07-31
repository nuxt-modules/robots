// Core types for the bot detection library
// Framework-agnostic types

export interface BotDetectionRequest {
  path: string
  method: string
  headers: Record<string, string | string[] | undefined>
  ip: string
  timestamp?: number
}

export interface BotDetectionResponse {
  isBot: boolean
  confidence: number
  score: number
  factors: Array<{
    type: string
    score: number
    reason: string
  }>
  recommendation: 'allow' | 'challenge' | 'block'
  sessionId: string
}

export interface SessionData {
  id: string
  lastRequests: Array<{
    timestamp: number
    path: string
    status?: number
    timeSincePrevious?: number
    method?: string
  }>
  suspiciousPathHits: number
  maybeSensitivePathHits: number
  uniqueSensitivePathsAccessed: string[]
  errorCount: number
  score: number
  lastScore: number
  lastUpdated: number
  knownGoodActions: number
  requestMethodVariety: string[]
  averageTimeBetweenRequests?: number
  requestSequenceEntropy: number
  firstSeenAt: number
  behaviorChangePoints?: number[]
}

export interface IPData {
  sessionCount: number
  activeSessions: string[]
  suspiciousScore: number
  lastUpdated: number
  legitSessionsCount: number
  sessionsPerHour?: number
  lastSessionCreated?: number
  isBot?: boolean
  isBotConfidence?: number
  details?: { name: string, type: string, trusted?: boolean } | null
  factors: string[]
}

export interface SiteProfile {
  detectedCMS?: 'wordpress' | 'drupal' | 'nuxt' | 'next' | 'unknown'
  hasAdminArea: boolean
  adminPaths: string[]
  apiEndpoints: string[]
  existingPaths: Set<string>
  userAgentPatterns: Map<string, number>
  legitimateAccessPatterns: string[]
}

export interface DetectionContext {
  userIntent: 'browsing' | 'exploring' | 'scanning' | 'exploiting' | 'unknown'
  accessPattern: 'human-like' | 'systematic' | 'random' | 'malicious'
  credibilityScore: number
  authenticationStatus: 'authenticated' | 'anonymous' | 'unknown'
  referrerContext: 'internal' | 'search-engine' | 'direct' | 'suspicious'
  technicalProfile: {
    browserFeatures: string[]
    networkConsistency: number
    headerCredibility: number
  }
}

// Storage interface - framework agnostic
export interface BotDetectionStorage {
  getSession(sessionId: string): Promise<SessionData | null>
  setSession(sessionId: string, data: SessionData): Promise<void>
  getIP(ip: string): Promise<IPData | null>
  setIP(ip: string, data: IPData): Promise<void>
  getSiteProfile(): Promise<SiteProfile | null>
  setSiteProfile(profile: SiteProfile): Promise<void>
  cleanup?(): Promise<void>
}

// Configuration interface
export interface BotDetectionConfig {
  session?: {
    ttl?: number
    maxSessionsPerIP?: number
  }
  thresholds?: {
    definitelyBot?: number
    likelyBot?: number
    suspicious?: number
  }
  customSensitivePaths?: string[]
  ipFilter?: {
    trustedIPs?: string[]
    blockedIPs?: string[]
  }
  debug?: boolean
  behaviors?: BehaviorConfiguration
}

export interface BehaviorConfiguration {
  simple?: Record<string, { enabled: boolean, weight: number }>
  intermediate?: Record<string, { enabled: boolean, weight: number }>
  advanced?: Record<string, { enabled: boolean, weight: number }>
}

// Session identifier interface - allows for different session strategies
export interface SessionIdentifier {
  getSessionId(request: BotDetectionRequest): Promise<string> | string
}

// Response status interface - allows framework to provide response status
export interface ResponseStatusProvider {
  getStatus(request: BotDetectionRequest): number | undefined
}