import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryAdapter } from '../src/adapters/memory'
import { H3SessionIdentifier } from '../src/adapters/h3'
import type { SessionData, IPData } from '../src/behavior'
import type { BotDetectionRequest } from '../src/types'
import { TrafficType } from '../src/behavior'

describe('Storage Adapters', () => {
  describe('MemoryAdapter', () => {
    let adapter: MemoryAdapter

    beforeEach(() => {
      adapter = new MemoryAdapter({ ttl: 1000 }) // 1 second TTL for testing
    })

    it('should store and retrieve session data', async () => {
      const sessionData: SessionData = {
        lastRequests: [],
        suspiciousPathHits: 0,
        maybeSensitivePathHits: 0,
        uniqueSensitivePathsAccessed: [],
        errorCount: 0,
        score: 0,
        lastScore: 0,
        lastUpdated: Date.now(),
        knownGoodActions: 0,
        requestMethodVariety: [],
        requestSequenceEntropy: 0,
        firstSeenAt: Date.now(),
        behaviorChangePoints: [],
        trafficType: TrafficType.UNKNOWN
      }

      await adapter.setSession('test-session', sessionData)
      const retrieved = await adapter.getSession('test-session')

      expect(retrieved).toEqual(sessionData)
    })

    it('should store and retrieve IP data', async () => {
      const ipData: IPData = {
        sessionCount: 1,
        activeSessions: ['test-session'],
        suspiciousScore: 0,
        lastUpdated: Date.now(),
        legitSessionsCount: 1,
        factores: [],
        isBot: false,
        isBotConfidence: 0,
        lastSessionCreated: Date.now()
      }

      await adapter.setIP('192.168.1.1', ipData)
      const retrieved = await adapter.getIP('192.168.1.1')

      expect(retrieved).toEqual(ipData)
    })

    it('should handle TTL expiration', async () => {
      const sessionData: SessionData = {
        lastRequests: [],
        suspiciousPathHits: 0,
        maybeSensitivePathHits: 0,
        uniqueSensitivePathsAccessed: [],
        errorCount: 0,
        score: 0,
        lastScore: 0,
        lastUpdated: Date.now() - 2000, // 2 seconds ago (expired)
        knownGoodActions: 0,
        requestMethodVariety: [],
        requestSequenceEntropy: 0,
        firstSeenAt: Date.now() - 2000,
        behaviorChangePoints: [],
        trafficType: TrafficType.UNKNOWN
      }

      await adapter.setSession('expired-session', sessionData)
      const retrieved = await adapter.getSession('expired-session')

      expect(retrieved).toBeNull()
    })

    it('should cleanup expired data', async () => {
      const oldSessionData: SessionData = {
        lastRequests: [],
        suspiciousPathHits: 0,
        maybeSensitivePathHits: 0,
        uniqueSensitivePathsAccessed: [],
        errorCount: 0,
        score: 0,
        lastScore: 0,
        lastUpdated: Date.now() - 2000,
        knownGoodActions: 0,
        requestMethodVariety: [],
        requestSequenceEntropy: 0,
        firstSeenAt: Date.now() - 2000,
        behaviorChangePoints: [],
        trafficType: TrafficType.UNKNOWN
      }

      const newSessionData: SessionData = {
        ...oldSessionData,
        lastUpdated: Date.now()
      }

      await adapter.setSession('old-session', oldSessionData)
      await adapter.setSession('new-session', newSessionData)

      await adapter.cleanup()

      expect(await adapter.getSession('old-session')).toBeNull()
      expect(await adapter.getSession('new-session')).toBeTruthy()
    })

    it('should provide stats', () => {
      const stats = adapter.getStats()
      
      expect(stats).toHaveProperty('sessions')
      expect(stats).toHaveProperty('ips')
      expect(stats).toHaveProperty('hasSiteProfile')
      expect(typeof stats.sessions).toBe('number')
      expect(typeof stats.ips).toBe('number')
      expect(typeof stats.hasSiteProfile).toBe('boolean')
    })

    it('should clear all data', async () => {
      const sessionData: SessionData = {
        lastRequests: [],
        suspiciousPathHits: 0,
        maybeSensitivePathHits: 0,
        uniqueSensitivePathsAccessed: [],
        errorCount: 0,
        score: 0,
        lastScore: 0,
        lastUpdated: Date.now(),
        knownGoodActions: 0,
        requestMethodVariety: [],
        requestSequenceEntropy: 0,
        firstSeenAt: Date.now(),
        behaviorChangePoints: [],
        trafficType: TrafficType.UNKNOWN
      }

      await adapter.setSession('test-session', sessionData)
      adapter.clear()
      
      expect(await adapter.getSession('test-session')).toBeNull()
      expect(adapter.getStats().sessions).toBe(0)
    })
  })

  describe('H3SessionIdentifier', () => {
    let identifier: H3SessionIdentifier

    beforeEach(() => {
      identifier = new H3SessionIdentifier('test-secret')
    })

    it('should generate consistent session IDs for same input', async () => {
      const request: BotDetectionRequest = {
        path: '/',
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 test browser'
        },
        ip: '192.168.1.1',
        timestamp: Date.now()
      }

      const sessionId1 = await identifier.getSessionId(request)
      const sessionId2 = await identifier.getSessionId(request)

      expect(sessionId1).toBe(sessionId2)
      expect(typeof sessionId1).toBe('string')
      expect(sessionId1.length).toBeGreaterThan(0)
    })

    it('should generate different session IDs for different IPs', async () => {
      const request1: BotDetectionRequest = {
        path: '/',
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 test browser'
        },
        ip: '192.168.1.1',
        timestamp: Date.now()
      }

      const request2: BotDetectionRequest = {
        ...request1,
        ip: '192.168.1.2'
      }

      const sessionId1 = await identifier.getSessionId(request1)
      const sessionId2 = await identifier.getSessionId(request2)

      expect(sessionId1).not.toBe(sessionId2)
    })

    it('should generate different session IDs for different user agents', async () => {
      const request1: BotDetectionRequest = {
        path: '/',
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 Firefox'
        },
        ip: '192.168.1.1',
        timestamp: Date.now()
      }

      const request2: BotDetectionRequest = {
        ...request1,
        headers: {
          'user-agent': 'Mozilla/5.0 Chrome'
        }
      }

      const sessionId1 = await identifier.getSessionId(request1)
      const sessionId2 = await identifier.getSessionId(request2)

      expect(sessionId1).not.toBe(sessionId2)
    })

    it('should handle missing user agent', async () => {
      const request: BotDetectionRequest = {
        path: '/',
        method: 'GET',
        headers: {},
        ip: '192.168.1.1',
        timestamp: Date.now()
      }

      const sessionId = await identifier.getSessionId(request)

      expect(typeof sessionId).toBe('string')
      expect(sessionId.length).toBeGreaterThan(0)
    })

    it('should handle array user agent headers', async () => {
      const request: BotDetectionRequest = {
        path: '/',
        method: 'GET',
        headers: {
          'user-agent': ['Mozilla/5.0 first', 'Mozilla/5.0 second']
        },
        ip: '192.168.1.1',
        timestamp: Date.now()
      }

      const sessionId = await identifier.getSessionId(request)

      expect(typeof sessionId).toBe('string')
      expect(sessionId.length).toBeGreaterThan(0)
    })
  })
})