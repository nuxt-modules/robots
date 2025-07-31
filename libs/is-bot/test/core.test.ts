import { describe, it, expect, beforeEach } from 'vitest'
import { BotDetectionEngine } from '../src/core'
import { MemoryAdapter } from '../src/adapters/memory'
import { H3SessionIdentifier } from '../src/adapters/h3'
import type { BotDetectionRequest } from '../src/types'

describe('BotDetectionEngine', () => {
  let engine: BotDetectionEngine
  let storage: MemoryAdapter
  let sessionIdentifier: H3SessionIdentifier

  beforeEach(() => {
    storage = new MemoryAdapter()
    sessionIdentifier = new H3SessionIdentifier('test-secret')
    engine = new BotDetectionEngine({
      storage,
      sessionIdentifier,
      config: {
        thresholds: {
          likelyBot: 70,
          definitelyBot: 90,
          suspicious: 40
        },
        ipFilter: {
          trustedIPs: ['127.0.0.1'],
          blockedIPs: ['192.168.1.100']
        }
      }
    })
  })

  describe('basic detection', () => {
    it('should detect legitimate user', async () => {
      const request: BotDetectionRequest = {
        path: '/',
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        ip: '192.168.1.1',
        timestamp: Date.now()
      }

      const result = await engine.analyze(request)
      
      expect(result.isBot).toBe(false)
      expect(result.score).toBeLessThan(40)
      expect(result.recommendation).toBe('allow')
    })

    it('should detect obvious bot user agent', async () => {
      const request: BotDetectionRequest = {
        path: '/',
        method: 'GET',
        headers: {
          'user-agent': 'curl/7.68.0'
        },
        ip: '192.168.1.1',
        timestamp: Date.now()
      }

      const result = await engine.analyze(request)
      
      expect(result.isBot).toBe(true)
      expect(result.score).toBeGreaterThan(50)
      expect(result.factors.some(f => f.type.includes('USER_AGENT'))).toBe(true)
    })

    it('should handle trusted IPs', async () => {
      const request: BotDetectionRequest = {
        path: '/',
        method: 'GET',
        headers: {
          'user-agent': 'curl/7.68.0'
        },
        ip: '127.0.0.1', // Trusted IP
        timestamp: Date.now()
      }

      const result = await engine.analyze(request)
      
      expect(result.isBot).toBe(false)
      expect(result.score).toBe(0)
      expect(result.recommendation).toBe('allow')
      expect(result.factors.some(f => f.reason === 'ip-trusted')).toBe(true)
    })

    it('should handle blocked IPs', async () => {
      const request: BotDetectionRequest = {
        path: '/',
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 (legitimate browser)'
        },
        ip: '192.168.1.100', // Blocked IP
        timestamp: Date.now()
      }

      const result = await engine.analyze(request)
      
      expect(result.isBot).toBe(true)
      expect(result.score).toBe(100)
      expect(result.recommendation).toBe('block')
      expect(result.factors.some(f => f.reason === 'ip-blocked')).toBe(true)
    })
  })

  describe('behavioral analysis', () => {
    it('should detect rapid requests', async () => {
      const baseRequest: BotDetectionRequest = {
        path: '/api/data',
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        ip: '192.168.1.50',
        timestamp: Date.now()
      }

      // Make multiple rapid requests
      let lastResult
      for (let i = 0; i < 15; i++) {
        const request = {
          ...baseRequest,
          timestamp: Date.now() + (i * 100) // 100ms intervals
        }
        lastResult = await engine.analyze(request)
      }

      expect(lastResult!.score).toBeGreaterThan(30)
      expect(lastResult!.factors.some(f => f.type.includes('TIMING') || f.type.includes('RATE'))).toBe(true)
    })

    it('should detect sensitive path access', async () => {
      const request: BotDetectionRequest = {
        path: '/admin/login',
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        ip: '192.168.1.2',
        timestamp: Date.now()
      }

      const result = await engine.analyze(request)
      
      expect(result.score).toBeGreaterThan(10)
    })

    it('should track session behavior over time', async () => {
      const sessionId = 'test-session-123'
      
      // First request should be low score
      const request1: BotDetectionRequest = {
        path: '/',
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        ip: '192.168.1.3',
        timestamp: Date.now()
      }
      
      const result1 = await engine.analyze(request1)
      expect(result1.score).toBeLessThan(20)
      
      // Subsequent rapid requests should increase score
      for (let i = 0; i < 20; i++) {
        const request = {
          ...request1,
          path: `/page-${i}`,
          timestamp: Date.now() + (i * 50) // Very rapid
        }
        await engine.analyze(request)
      }
      
      // Final request should have higher score
      const finalResult = await engine.analyze({
        ...request1,
        path: '/final',
        timestamp: Date.now() + 1000
      })
      
      expect(finalResult.score).toBeGreaterThan(result1.score)
    })
  })

  describe('configuration', () => {
    it('should respect custom thresholds', async () => {
      engine.updateConfig({
        thresholds: {
          likelyBot: 30, // Lower threshold
          definitelyBot: 50,
          suspicious: 10
        }
      })

      const request: BotDetectionRequest = {
        path: '/admin',
        method: 'GET',
        headers: {
          'user-agent': 'curl/7.68.0'
        },
        ip: '192.168.1.4',
        timestamp: Date.now()
      }

      const result = await engine.analyze(request)
      
      // Should be flagged as bot with lower threshold
      expect(result.isBot).toBe(true)
    })

    it('should handle custom sensitive paths', async () => {
      engine.updateConfig({
        customSensitivePaths: ['/api/secret', '/private/*']
      })

      const request: BotDetectionRequest = {
        path: '/api/secret',
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 (legitimate browser)'
        },
        ip: '192.168.1.5',
        timestamp: Date.now()
      }

      const result = await engine.analyze(request)
      
      expect(result.score).toBeGreaterThan(0)
    })
  })

  describe('storage integration', () => {
    it('should persist session data', async () => {
      const request: BotDetectionRequest = {
        path: '/test',
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 (test browser)'
        },
        ip: '192.168.1.6',
        timestamp: Date.now()
      }

      // First request
      await engine.analyze(request)
      
      // Check that session data was stored
      const sessionId = await sessionIdentifier.getSessionId(request)
      const sessionData = await storage.getSession(sessionId)
      
      expect(sessionData).toBeTruthy()
      expect(sessionData!.lastRequests).toHaveLength(1)
      expect(sessionData!.lastRequests[0].path).toBe('/test')
    })

    it('should persist IP data', async () => {
      const request: BotDetectionRequest = {
        path: '/test',
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 (test browser)'
        },
        ip: '192.168.1.7',
        timestamp: Date.now()
      }

      await engine.analyze(request)
      
      const ipData = await storage.getIP(request.ip)
      
      expect(ipData).toBeTruthy()
      expect(ipData!.sessionCount).toBe(1)
      expect(ipData!.activeSessions).toHaveLength(1)
    })
  })

  describe('error handling', () => {
    it('should handle missing user agent gracefully', async () => {
      const request: BotDetectionRequest = {
        path: '/',
        method: 'GET',
        headers: {},
        ip: '192.168.1.8',
        timestamp: Date.now()
      }

      const result = await engine.analyze(request)
      
      expect(result).toBeTruthy()
      expect(result.score).toBeGreaterThan(0) // Missing user agent should increase score
    })

    it('should handle invalid IP addresses', async () => {
      const request: BotDetectionRequest = {
        path: '/',
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0'
        },
        ip: 'invalid-ip',
        timestamp: Date.now()
      }

      const result = await engine.analyze(request)
      
      expect(result).toBeTruthy()
      expect(typeof result.score).toBe('number')
    })
  })
})