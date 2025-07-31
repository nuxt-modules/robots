import { describe, it, expect, beforeEach } from 'vitest'
import {
  analyzeBasicUserAgent,
  analyzeBasicTiming,
  analyzeBasicRateLimit,
  analyzePathAccess,
  analyzeHeaderConsistency,
  analyzeBurstPattern,
  DEFAULT_BEHAVIOR_CONFIG
} from '../src/behaviors'
import type { SessionData } from '../src/behavior'
import { TrafficType } from '../src/behavior'

describe('Behavior Analysis Functions', () => {
  let mockSessionData: SessionData

  beforeEach(() => {
    mockSessionData = {
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
  })

  describe('analyzeBasicUserAgent', () => {
    it('should detect bot user agents', () => {
      const headers = { 'user-agent': 'curl/7.68.0' }
      const result = analyzeBasicUserAgent(headers)
      
      expect(result.score).toBeGreaterThan(0)
      expect(result.reason).toContain('suspicious-user-agent-length')
    })

    it('should accept legitimate user agents', () => {
      const headers = { 
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
      const result = analyzeBasicUserAgent(headers)
      
      expect(result.score).toBe(0)
    })

    it('should penalize missing user agent', () => {
      const headers = {}
      const result = analyzeBasicUserAgent(headers)
      
      expect(result.score).toBeGreaterThan(0)
      expect(result.reason).toContain('missing')
    })

    it('should penalize short user agent', () => {
      const headers = { 'user-agent': 'Bot' }
      const result = analyzeBasicUserAgent(headers)
      
      expect(result.score).toBeGreaterThan(0)
      expect(result.reason).toContain('suspicious-user-agent-length')
    })
  })

  describe('analyzeBasicTiming', () => {
    it('should detect rapid requests', () => {
      const now = Date.now()
      mockSessionData.lastRequests = [
        { timestamp: now - 500, path: '/page1', timeSincePrevious: 0, method: 'GET' },
        { timestamp: now - 400, path: '/page2', timeSincePrevious: 100, method: 'GET' },
        { timestamp: now - 300, path: '/page3', timeSincePrevious: 100, method: 'GET' },
        { timestamp: now - 200, path: '/page4', timeSincePrevious: 100, method: 'GET' },
        { timestamp: now - 100, path: '/page5', timeSincePrevious: 100, method: 'GET' }
      ]

      const result = analyzeBasicTiming(mockSessionData)
      
      expect(result.score).toBeGreaterThan(0)
      expect(result.reason).toContain('robotic-timing-detected')
    })

    it('should accept normal timing patterns', () => {
      const now = Date.now()
      mockSessionData.lastRequests = [
        { timestamp: now - 10000, path: '/page1', timeSincePrevious: 0, method: 'GET' },
        { timestamp: now - 5000, path: '/page2', timeSincePrevious: 5000, method: 'GET' },
        { timestamp: now - 2000, path: '/page3', timeSincePrevious: 3000, method: 'GET' }
      ]

      const result = analyzeBasicTiming(mockSessionData)
      
      expect(result.score).toBe(0)
    })

    it('should handle single request', () => {
      mockSessionData.lastRequests = [
        { timestamp: Date.now(), path: '/page1', timeSincePrevious: 0, method: 'GET' }
      ]

      const result = analyzeBasicTiming(mockSessionData)
      
      expect(result.score).toBe(0)
    })
  })

  describe('analyzeBasicRateLimit', () => {
    it('should detect high request volume', () => {
      // Add many requests
      for (let i = 0; i < 50; i++) {
        mockSessionData.lastRequests.push({
          timestamp: Date.now() - (i * 1000),
          path: `/page${i}`,
          timeSincePrevious: 1000,
          method: 'GET'
        })
      }

      const result = analyzeBasicRateLimit(mockSessionData)
      
      expect(result.score).toBeGreaterThan(0)
      expect(result.reason).toContain('excessive-requests')
    })

    it('should accept normal request volume', () => {
      for (let i = 0; i < 5; i++) {
        mockSessionData.lastRequests.push({
          timestamp: Date.now() - (i * 5000),
          path: `/page${i}`,
          timeSincePrevious: 5000,
          method: 'GET'
        })
      }

      const result = analyzeBasicRateLimit(mockSessionData)
      
      expect(result.score).toBe(0)
    })
  })

  describe('analyzePathAccess', () => {
    it('should detect sensitive path access', () => {
      const context = {
        userIntent: 'unknown' as const,
        accessPattern: 'systematic' as const,
        credibilityScore: 0,
        authenticationStatus: 'anonymous' as const,
        referrerContext: 'direct' as const,
        technicalProfile: {
          browserFeatures: [],
          networkConsistency: 0.5,
          headerCredibility: 0.5
        }
      }

      const result = analyzePathAccess('/wp-login.php', context)
      
      expect(result.score).toBeGreaterThan(0)
      expect(result.reason).toContain('high-risk-path')
    })

    it('should accept normal path access', () => {
      const context = {
        userIntent: 'browsing' as const,
        accessPattern: 'human-like' as const,
        credibilityScore: 50,
        authenticationStatus: 'anonymous' as const,
        referrerContext: 'search-engine' as const,
        technicalProfile: {
          browserFeatures: [],
          networkConsistency: 0.8,
          headerCredibility: 0.8
        }
      }

      const result = analyzePathAccess('/about', context)
      
      expect(result.score).toBe(0)
    })
  })

  describe('analyzeHeaderConsistency', () => {
    it('should detect inconsistent headers', () => {
      const headers = {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'accept-language': 'zh-CN,zh;q=0.9', // Chinese language
        'accept-encoding': 'compress' // Old encoding
      }

      const result = analyzeHeaderConsistency(headers)
      
      expect(result.score).toBeGreaterThan(0)
    })

    it('should accept consistent headers', () => {
      const headers = {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'accept-language': 'en-US,en;q=0.9',
        'accept-encoding': 'gzip, deflate, br',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }

      const result = analyzeHeaderConsistency(headers)
      
      expect(result.score).toBe(0)
    })
  })

  describe('analyzeBurstPattern', () => {
    it('should detect burst patterns', () => {
      const now = Date.now()
      // Create a burst of requests
      for (let i = 0; i < 10; i++) {
        mockSessionData.lastRequests.push({
          timestamp: now - (200 * i), // 200ms apart
          path: `/api/data${i}`,
          timeSincePrevious: i === 0 ? 0 : 200,
          method: 'GET'
        })
      }

      const result = analyzeBurstPattern(mockSessionData)
      
      expect(result.score).toBeGreaterThan(0)
      expect(result.reason).toContain('burst')
    })

    it('should accept normal request patterns', () => {
      const now = Date.now()
      // Create normal spaced requests
      for (let i = 0; i < 5; i++) {
        mockSessionData.lastRequests.push({
          timestamp: now - (5000 * i), // 5 seconds apart
          path: `/page${i}`,
          timeSincePrevious: i === 0 ? 0 : 5000,
          method: 'GET'
        })
      }

      const result = analyzeBurstPattern(mockSessionData)
      
      expect(result.score).toBe(0)
    })
  })

  describe('DEFAULT_BEHAVIOR_CONFIG', () => {
    it('should have valid configuration structure', () => {
      expect(DEFAULT_BEHAVIOR_CONFIG).toHaveProperty('simple')
      expect(DEFAULT_BEHAVIOR_CONFIG).toHaveProperty('intermediate')
      expect(DEFAULT_BEHAVIOR_CONFIG).toHaveProperty('advanced')
      
      // Check that all behaviors have enabled and weight properties
      const allBehaviors = [
        ...Object.values(DEFAULT_BEHAVIOR_CONFIG.simple),
        ...Object.values(DEFAULT_BEHAVIOR_CONFIG.intermediate),
        ...Object.values(DEFAULT_BEHAVIOR_CONFIG.advanced)
      ]
      
      allBehaviors.forEach(behavior => {
        expect(behavior).toHaveProperty('enabled')
        expect(behavior).toHaveProperty('weight')
        expect(typeof behavior.enabled).toBe('boolean')
        expect(typeof behavior.weight).toBe('number')
      })
    })

    it('should have reasonable weight values', () => {
      const allBehaviors = [
        ...Object.values(DEFAULT_BEHAVIOR_CONFIG.simple),
        ...Object.values(DEFAULT_BEHAVIOR_CONFIG.intermediate),
        ...Object.values(DEFAULT_BEHAVIOR_CONFIG.advanced)
      ]
      
      allBehaviors.forEach(behavior => {
        expect(behavior.weight).toBeGreaterThan(0)
        expect(behavior.weight).toBeLessThanOrEqual(2) // Reasonable upper bound
      })
    })
  })
})