// Core bot detection engine - H3/Nuxt focused
import type { H3Event } from 'h3'
import type {
  BotDetectionConfig,
  BotDetectionRequest,
  BotDetectionResponse,
  DetectionContext,
  ResponseStatusProvider,
  SessionIdentifier,
  SiteProfile
} from './types'
import type { IPData, SessionData } from './behavior'
import type { BehaviorStorage } from './adapters/behavior-storage'
import { modularBotAnalysis, DEFAULT_BEHAVIOR_CONFIG, type BotDetectionBehaviorConfig } from './modular-analyzer'
import { type BotDetectionBehavior, TrafficType } from './behavior'

export class BotDetectionEngine {
  private storage: BehaviorStorage
  private sessionIdentifier: SessionIdentifier
  private responseStatusProvider?: ResponseStatusProvider
  private config: BotDetectionConfig
  private behaviorConfig: BotDetectionBehaviorConfig
  private siteProfile: SiteProfile | null = null

  constructor(options: {
    storage: BehaviorStorage
    sessionIdentifier: SessionIdentifier
    responseStatusProvider?: ResponseStatusProvider
    config?: BotDetectionConfig
  }) {
    this.storage = options.storage
    this.sessionIdentifier = options.sessionIdentifier
    this.responseStatusProvider = options.responseStatusProvider
    this.config = {
      session: {
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        maxSessionsPerIP: 10,
        ...options.config?.session
      },
      thresholds: {
        definitelyBot: 90,
        likelyBot: 70,
        suspicious: 40,
        ...options.config?.thresholds
      },
      customSensitivePaths: options.config?.customSensitivePaths || [],
      ipFilter: {
        trustedIPs: ['127.0.0.1', '::1'],
        blockedIPs: [],
        ...options.config?.ipFilter
      },
      debug: options.config?.debug || false,
      behaviors: options.config?.behaviors
    }

    // Merge behavior configuration
    this.behaviorConfig = {
      simple: { ...DEFAULT_BEHAVIOR_CONFIG.simple, ...this.config.behaviors?.simple },
      intermediate: { ...DEFAULT_BEHAVIOR_CONFIG.intermediate, ...this.config.behaviors?.intermediate },
      advanced: { ...DEFAULT_BEHAVIOR_CONFIG.advanced, ...this.config.behaviors?.advanced }
    }
  }

  async analyze(request: BotDetectionRequest, event?: H3Event): Promise<BotDetectionResponse> {
    const timestamp = request.timestamp || Date.now()
    
    // Get session ID
    const sessionId = await this.sessionIdentifier.getSessionId(request)
    
    // Check IP blocklist/allowlist
    if (this.isIPBlocked(request.ip)) {
      return this.createBlockedResponse(sessionId, 'ip-blocked')
    }
    
    if (this.isIPTrusted(request.ip)) {
      return this.createTrustedResponse(sessionId, 'ip-trusted')
    }

    // Get or create session and IP data
    const [sessionData, ipData] = await Promise.all([
      this.getOrCreateSession(sessionId, timestamp),
      this.getOrCreateIPData(request.ip, sessionId, timestamp)
    ])

    // Get or create site profile
    this.siteProfile = await this.getOrCreateSiteProfile(request)

    // Create behavior object for analysis
    const behavior: BotDetectionBehavior = {
      id: sessionId,
      session: sessionData,
      ip: ipData,
      dirty: false
    }

    // Run modular analysis - requires H3Event
    let analysis
    if (event) {
      analysis = modularBotAnalysis({
        event,
        behavior,
        config: this.behaviorConfig,
        debug: this.config.debug
      })
    } else {
      // Fallback analysis without H3Event
      analysis = {
        botScore: this.basicBotScore(request, sessionData, ipData),
        confidence: 50,
        factors: [],
        recommendation: 'allow' as const
      }
    }

    // Update session data
    this.updateSessionData(sessionData, request, timestamp)

    // Update IP data
    this.updateIPData(ipData, sessionData, timestamp)

    // Apply response status if available
    if (this.responseStatusProvider) {
      const status = this.responseStatusProvider.getStatus(request)
      if (status) {
        this.applyResponseStatus(sessionData, status)
      }
    }

    // Save updated data
    await Promise.all([
      this.storage.setSession(sessionId, sessionData),
      this.storage.setIP(request.ip, ipData),
      this.siteProfile ? this.storage.setSiteProfile(this.siteProfile) : Promise.resolve()
    ])

    return {
      isBot: analysis.botScore >= (this.config.thresholds?.likelyBot || 70),
      confidence: analysis.confidence,
      score: analysis.botScore,
      factors: analysis.factors,
      recommendation: analysis.recommendation,
      sessionId
    }
  }

  private isIPBlocked(ip: string): boolean {
    return this.config.ipFilter?.blockedIPs?.includes(ip) || false
  }

  private isIPTrusted(ip: string): boolean {
    return this.config.ipFilter?.trustedIPs?.includes(ip) || false
  }

  private async getOrCreateSession(sessionId: string, timestamp: number): Promise<SessionData> {
    const existing = await this.storage.getSession(sessionId)
    if (existing) {
      return existing
    }

    return {
      lastRequests: [],
      suspiciousPathHits: 0,
      maybeSensitivePathHits: 0,
      uniqueSensitivePathsAccessed: [],
      errorCount: 0,
      score: 0,
      lastScore: 0,
      lastUpdated: timestamp,
      knownGoodActions: 0,
      requestMethodVariety: [],
      requestSequenceEntropy: 0,
      firstSeenAt: timestamp,
      behaviorChangePoints: [],
      trafficType: TrafficType.UNKNOWN
    }
  }

  private async getOrCreateIPData(ip: string, sessionId: string, timestamp: number): Promise<IPData> {
    const existing = await this.storage.getIP(ip)
    if (existing) {
      // Add session if not already tracked
      if (!existing.activeSessions.includes(sessionId)) {
        existing.activeSessions.push(sessionId)
        existing.sessionCount = existing.activeSessions.length
      }
      return existing
    }

    return {
      sessionCount: 1,
      activeSessions: [sessionId],
      suspiciousScore: 0,
      lastUpdated: timestamp,
      legitSessionsCount: 0,
      factores: [],
      isBot: false,
      isBotConfidence: 0,
      lastSessionCreated: timestamp
    }
  }

  private async getOrCreateSiteProfile(request: BotDetectionRequest): Promise<SiteProfile> {
    const existing = await this.storage.getSiteProfile()
    if (existing) {
      return existing
    }

    return {
      detectedCMS: 'unknown',
      hasAdminArea: false,
      adminPaths: [],
      apiEndpoints: [],
      existingPaths: new Set(),
      userAgentPatterns: new Map(),
      legitimateAccessPatterns: []
    }
  }

  private updateSessionData(sessionData: SessionData, request: BotDetectionRequest, timestamp: number) {
    // Add current request
    sessionData.lastRequests.push({
      timestamp,
      path: request.path,
      method: request.method,
      timeSincePrevious: sessionData.lastRequests.length > 0 
        ? timestamp - sessionData.lastRequests[sessionData.lastRequests.length - 1].timestamp 
        : 0
    })

    // Keep only last 30 requests
    if (sessionData.lastRequests.length > 30) {
      sessionData.lastRequests.shift()
    }

    // Update method variety
    if (!sessionData.requestMethodVariety.includes(request.method)) {
      sessionData.requestMethodVariety.push(request.method)
    }

    sessionData.lastUpdated = timestamp
  }

  private updateIPData(ipData: IPData, sessionData: SessionData, timestamp: number) {
    ipData.lastUpdated = timestamp
    
    // Update IP score based on session score
    ipData.suspiciousScore = Math.max(
      ipData.suspiciousScore * 0.9, // Decay
      sessionData.score * 0.8 // Current session influence
    )

    // Update bot confidence
    ipData.isBotConfidence = (sessionData.score + ipData.suspiciousScore) / 2
    ipData.isBot = sessionData.score >= (this.config.thresholds?.likelyBot || 70)
  }

  private applyResponseStatus(sessionData: SessionData, status: number) {
    // Update the last request with status
    if (sessionData.lastRequests.length > 0) {
      sessionData.lastRequests[sessionData.lastRequests.length - 1].status = status
    }

    // Count errors
    if (status >= 400) {
      sessionData.errorCount++
      
      // Apply error penalty
      if (sessionData.errorCount > 2) {
        sessionData.score += Math.min(15, sessionData.errorCount * 2)
      }
    } else if (status >= 200 && status < 300) {
      // Successful requests indicate legitimate use
      sessionData.score = Math.max(0, sessionData.score - 1)
      sessionData.knownGoodActions += 0.5
    }

    // Cap score
    sessionData.score = Math.min(100, sessionData.score)
  }

  private basicBotScore(request: BotDetectionRequest, sessionData: SessionData, ipData: IPData): number {
    let score = 0
    
    // Basic user agent check
    const userAgent = Array.isArray(request.headers['user-agent']) 
      ? request.headers['user-agent'][0] || ''
      : request.headers['user-agent'] || ''
    if (!userAgent || userAgent.length < 20) {
      score += 30
    }
    
    // Check for common bot patterns
    const botPatterns = /bot|crawler|spider|scraper|curl|wget|python-requests/i
    if (botPatterns.test(userAgent)) {
      score += 50
    }
    
    // Rate limiting - simple check
    if (sessionData.lastRequests.length > 10) {
      const avgInterval = sessionData.lastRequests.reduce((sum, req, i) => {
        return i > 0 ? sum + (req.timestamp - sessionData.lastRequests[i-1].timestamp) : sum
      }, 0) / Math.max(1, sessionData.lastRequests.length - 1)
      
      if (avgInterval < 1000) { // Less than 1 second between requests
        score += 25
      }
    }
    
    // Sensitive path access
    const sensitivePaths = ['/admin', '/wp-admin', '/.env', '/wp-login']
    if (sensitivePaths.some(path => request.path.includes(path))) {
      score += 20
    }
    
    return Math.min(100, score)
  }

  private createBlockedResponse(sessionId: string, reason: string): BotDetectionResponse {
    return {
      isBot: true,
      confidence: 100,
      score: 100,
      factors: [{ type: 'IP_FILTER', score: 100, reason }],
      recommendation: 'block',
      sessionId
    }
  }

  private createTrustedResponse(sessionId: string, reason: string): BotDetectionResponse {
    return {
      isBot: false,
      confidence: 100,
      score: 0,
      factors: [{ type: 'IP_FILTER', score: -100, reason }],
      recommendation: 'allow',
      sessionId
    }
  }

  // Public configuration methods
  updateConfig(config: Partial<BotDetectionConfig>) {
    this.config = { ...this.config, ...config }
  }

  updateBehaviorConfig(config: Partial<BotDetectionBehaviorConfig>) {
    this.behaviorConfig = {
      simple: { ...this.behaviorConfig.simple, ...config.simple },
      intermediate: { ...this.behaviorConfig.intermediate, ...config.intermediate },
      advanced: { ...this.behaviorConfig.advanced, ...config.advanced }
    }
  }

  // Cleanup method
  async cleanup() {
    if (this.storage.cleanup) {
      await this.storage.cleanup()
    }
  }
}