import type { H3Event } from 'h3'
import type { BotDetectionBehavior, IPData, SessionData } from './behavior'
import { useStorage } from 'nitropack/runtime'
import { getRequestIP, useSession } from 'h3'
import { TrafficType } from './behavior'

import { useRuntimeConfig } from '#imports'

// Performance optimization: Batch storage updates
const pendingUpdates = new Map<string, BotDetectionBehavior>()
let SESSION_TTL = 24 * 60 * 60 * 1000 // 24 hours
let MAX_SESSIONS_PER_IP = 10
let BATCH_FLUSH_INTERVAL = 30000 // 30 seconds
let MAX_PENDING_UPDATES = 100

// IP allowlist/blocklist for enhanced security
let TRUSTED_IPS = new Set(['127.0.0.1', '::1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'])
let BLOCKED_IPS = new Set<string>()
const TEMP_BLOCKED_IPS = new Map<string, number>() // IP -> unblock timestamp

// Configuration defaults
let configInitialized = false
function initializeConfig() {
  if (configInitialized) return
  
  try {
    const config = useRuntimeConfig()
    const botConfig = config.public?.robots?.botDetection
    
    if (botConfig && typeof botConfig === 'object') {
      // Update session config
      if (botConfig.session?.ttl) {
        SESSION_TTL = botConfig.session.ttl
      }
      if (botConfig.session?.maxSessionsPerIP) {
        MAX_SESSIONS_PER_IP = botConfig.session.maxSessionsPerIP
      }
      
      // Update IP filter config
      if (botConfig.ipFilter?.trustedIPs) {
        TRUSTED_IPS = new Set([...TRUSTED_IPS, ...botConfig.ipFilter.trustedIPs])
      }
      if (botConfig.ipFilter?.blockedIPs) {
        BLOCKED_IPS = new Set(botConfig.ipFilter.blockedIPs)
      }
    }
    
    configInitialized = true
  } catch (error) {
    // Fallback to defaults if config is not available
    configInitialized = true
  }
}

// IP utility functions
function isIPTrusted(ip: string): boolean {
  return TRUSTED_IPS.has(ip) || ip.startsWith('127.') || ip.startsWith('::1')
}

function isIPBlocked(ip: string): boolean {
  if (BLOCKED_IPS.has(ip)) return true
  
  const tempBlockExpiry = TEMP_BLOCKED_IPS.get(ip)
  if (tempBlockExpiry && Date.now() < tempBlockExpiry) {
    return true
  } else if (tempBlockExpiry) {
    // Temp block expired, remove it
    TEMP_BLOCKED_IPS.delete(ip)
  }
  return false
}

function blockIPTemporarily(ip: string, durationMs: number = 60 * 60 * 1000) { // 1 hour default
  TEMP_BLOCKED_IPS.set(ip, Date.now() + durationMs)
}

// Session cleanup utilities
function cleanupOldSessions(ipData: IPData): IPData {
  const now = Date.now()
  const validSessions = ipData.activeSessions.filter(sessionId => {
    // Keep sessions that are recent enough
    return (now - ipData.lastUpdated) < SESSION_TTL
  })
  
  // Limit sessions per IP
  if (validSessions.length > MAX_SESSIONS_PER_IP) {
    ipData.activeSessions = validSessions.slice(-MAX_SESSIONS_PER_IP)
  } else {
    ipData.activeSessions = validSessions
  }
  
  ipData.sessionCount = ipData.activeSessions.length
  return ipData
}

// Batch storage operations for performance
async function flushPendingUpdates() {
  if (pendingUpdates.size === 0) return
  
  const storage = useStorage('cache:robots:bot-detection')
  const updates = Array.from(pendingUpdates.entries())
  pendingUpdates.clear()
  
  // Batch write all pending updates
  await Promise.all(updates.map(async ([key, behavior]) => {
    const sessionKey = `session:${behavior.id}`
    const ipKey = `ip:${key.split(':')[1]}` // Extract IP from composite key
    
    return Promise.all([
      storage.setItem(sessionKey, behavior.session),
      storage.setItem(ipKey, cleanupOldSessions(behavior.ip))
    ])
  }))
}

// Auto-flush pending updates
setInterval(flushPendingUpdates, BATCH_FLUSH_INTERVAL)

// Flush when too many pending updates
function maybeForcedFlush() {
  if (pendingUpdates.size >= MAX_PENDING_UPDATES) {
    return flushPendingUpdates()
  }
}

export async function initBotDetectionSession(event: H3Event) {
  initializeConfig()
  
  const ip = getRequestIP(event, { xForwardedFor: true })
  
  // Get session password from config or generate default
  let sessionPassword = '80d42cfb-1cd2-462c-8f17-e3237d9027e9' // fallback
  try {
    const config = useRuntimeConfig()
    const botConfig = config.public?.robots?.botDetection
    if (botConfig && typeof botConfig === 'object' && botConfig.session?.password) {
      sessionPassword = botConfig.session.password
    }
  } catch (error) {
    // Use fallback password
  }
  
  const session = await useSession(event, {
    password: sessionPassword,
  })
  // fetch sdession data
  const sessionKey = `session:${session.id}`
  const ipKey = `ip:${ip}`
  // TODO runtimeConfig support
  return {
    sessionKey,
    ipKey,
    session,
    storage: useStorage('cache:robots:bot-detection'),
  }
}

export async function getBotDetectionBehavior(e: H3Event): Promise<BotDetectionBehavior> {
  const now = Date.now()
  const { ipKey, session, storage, sessionKey } = await initBotDetectionSession(e)
  const ip = getRequestIP(e, { xForwardedFor: true })
  
  // Check IP allowlist/blocklist first
  if (isIPTrusted(ip)) {
    return {
      id: session.id,
      session: {
        lastRequests: [],
        suspiciousPathHits: 0,
        maybeSensitivePathHits: 0,
        uniqueSensitivePathsAccessed: [],
        errorCount: 0,
        lastScore: 0,
        score: 0,
        lastUpdated: now,
        trafficType: TrafficType.REGULAR_USER,
        knownGoodActions: 10, // Trusted IPs get good score
        requestMethodVariety: [],
        requestSequenceEntropy: 0,
        firstSeenAt: now,
      },
      ip: {
        sessionCount: 1,
        activeSessions: [session.id],
        suspiciousScore: 0,
        lastUpdated: now,
        legitSessionsCount: 1,
        isBot: false,
        isBotConfidence: 0,
        lastSessionCreated: now,
        factores: ['trusted-ip'],
        details: { name: 'trusted', type: 'trusted', trusted: true }
      },
      trusted: true
    } satisfies BotDetectionBehavior & { trusted: boolean }
  }
  
  if (isIPBlocked(ip)) {
    return {
      id: session.id,
      session: {
        lastRequests: [],
        suspiciousPathHits: 0,
        maybeSensitivePathHits: 0,
        uniqueSensitivePathsAccessed: [],
        errorCount: 0,
        lastScore: 100,
        score: 100,
        lastUpdated: now,
        trafficType: TrafficType.MALICIOUS_BOT,
        knownGoodActions: 0,
        requestMethodVariety: [],
        requestSequenceEntropy: 0,
        firstSeenAt: now,
      },
      ip: {
        sessionCount: 1,
        activeSessions: [session.id],
        suspiciousScore: 100,
        lastUpdated: now,
        legitSessionsCount: 0,
        isBot: true,
        isBotConfidence: 100,
        lastSessionCreated: now,
        factores: ['blocked-ip'],
        details: { name: 'blocked', type: 'blocked', trusted: false }
      },
      blocked: true
    } satisfies BotDetectionBehavior & { blocked: boolean }
  }
  
  const sessionData = storage.getItem<SessionData>(sessionKey)
  const ipData = storage.getItem<IPData>(ipKey)
  return Promise.all([
    sessionData,
    ipData,
  ]).then(([sessionData, ip]) => {
    return {
      id: session.id,
      session: sessionData || {
        lastRequests: [],
        suspiciousPathHits: 0,
        maybeSensitivePathHits: 0,
        uniqueSensitivePathsAccessed: [],
        errorCount: 0,
        lastScore: 0,
        score: 0,
        lastUpdated: now,
        trafficType: TrafficType.UNKNOWN,
        knownGoodActions: 0,
        requestMethodVariety: [],
        requestSequenceEntropy: 0,
        firstSeenAt: now,
      },
      ip: cleanupOldSessions(ip || {
        sessionCount: 0,
        activeSessions: [],
        suspiciousScore: 0,
        lastUpdated: now,
        legitSessionsCount: 0,
        isBot: false,
        isBotConfidence: 0,
        lastSessionCreated: now,
        factores: [],
      }),
    } satisfies BotDetectionBehavior
  })
}

export async function updateBotSessionBehavior(e: H3Event, behavior: BotDetectionBehavior) {
  const ip = getRequestIP(e, { xForwardedFor: true })
  const compositeKey = `${behavior.id}:${ip}`
  
  // Add to pending updates for batch processing
  pendingUpdates.set(compositeKey, behavior)
  
  // If malicious behavior detected, block IP temporarily
  if (behavior.ip.isBot && behavior.ip.isBotConfidence > 80) {
    blockIPTemporarily(ip, 60 * 60 * 1000) // 1 hour block
  }
  
  // Force flush if too many pending updates
  await maybeForcedFlush()
}

// Export utilities for external use
export {
  isIPTrusted,
  isIPBlocked,
  blockIPTemporarily,
  flushPendingUpdates,
  TRUSTED_IPS,
  BLOCKED_IPS
}
