import { describe, it, expect, beforeEach } from 'vitest'
import { BotDetectionEngine } from '../src/core'
import { MemoryAdapter } from '../src/adapters/memory'
import { H3SessionIdentifier } from '../src/adapters/h3'
import type { BotDetectionRequest } from '../src/types'

describe('Integration Tests', () => {
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
        behaviors: {
          simple: {
            pathAnalysis: { enabled: true, weight: 1.0 },
            basicTiming: { enabled: true, weight: 1.0 },
            basicRateLimit: { enabled: true, weight: 1.0 },
            basicUserAgent: { enabled: true, weight: 1.0 },
            simplePatterns: { enabled: true, weight: 1.0 },
            basicPositiveSignals: { enabled: true, weight: 1.0 }
          },
          intermediate: {
            burstDetection: { enabled: true, weight: 1.0 },
            headerConsistency: { enabled: true, weight: 1.0 },
            contextualRateLimit: { enabled: true, weight: 1.0 }
          },
          advanced: {
            advancedTiming: { enabled: false, weight: 1.0 },
            advancedIntent: { enabled: false, weight: 1.0 },
            browserFingerprint: { enabled: false, weight: 1.0 },
            advancedPositiveSignals: { enabled: false, weight: 1.0 },
            behavioralCredibility: { enabled: false, weight: 1.0 }
          }
        }
      }
    })
  })

  describe('Realistic Bot Scenarios', () => {
    it('should detect web scraper bot', async () => {
      const baseRequest: BotDetectionRequest = {
        path: '/',
        method: 'GET',
        headers: {
          'user-agent': 'Python/3.9 requests/2.25.1'
        },
        ip: '203.0.113.1',
        timestamp: Date.now()
      }

      // Scraper typically accesses many pages rapidly
      const pages = [
        '/products',
        '/products/page/2',
        '/products/page/3',
        '/api/products',
        '/search?q=laptop',
        '/search?q=phone',
        '/sitemap.xml'
      ]

      let lastResult
      for (let i = 0; i < pages.length; i++) {
        const request = {
          ...baseRequest,
          path: pages[i],
          timestamp: Date.now() + (i * 500) // 500ms between requests
        }
        lastResult = await engine.analyze(request)
      }

      expect(lastResult!.isBot).toBe(true)
      expect(lastResult!.score).toBeGreaterThan(70)
      expect(lastResult!.factors.some(f => f.type.includes('USER_AGENT'))).toBe(true)
    })

    it('should detect aggressive crawler', async () => {
      const baseRequest: BotDetectionRequest = {
        path: '/',
        method: 'GET',
        headers: {
          'user-agent': 'curl/7.68.0'
        },
        ip: '198.51.100.1',
        timestamp: Date.now()
      }

      // Aggressive crawler hits many endpoints very quickly
      const endpoints = [
        '/',
        '/about',
        '/contact',
        '/admin',
        '/wp-admin',
        '/api/users',
        '/api/posts',
        '/.env',
        '/config.php',
        '/xmlrpc.php'
      ]

      let lastResult
      for (let i = 0; i < endpoints.length; i++) {
        const request = {
          ...baseRequest,
          path: endpoints[i],
          timestamp: Date.now() + (i * 100) // Very rapid - 100ms between requests
        }
        lastResult = await engine.analyze(request)
      }

      expect(lastResult!.isBot).toBe(true)
      expect(lastResult!.score).toBeGreaterThan(80)
      expect(lastResult!.recommendation).toBe('block')
    })

    it('should allow legitimate user browsing', async () => {
      const baseRequest: BotDetectionRequest = {
        path: '/',
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.5',
          'accept-encoding': 'gzip, deflate, br',
          'referer': 'https://google.com/'
        },
        ip: '192.0.2.1',
        timestamp: Date.now()
      }

      // Normal user browsing pattern
      const userJourney = [
        { path: '/', delay: 0 },
        { path: '/products', delay: 3000 },
        { path: '/products/laptop', delay: 5000 },
        { path: '/products/laptop?color=black', delay: 2000 },
        { path: '/cart', delay: 8000 },
        { path: '/checkout', delay: 4000 }
      ]

      let lastResult
      let currentTime = Date.now()
      
      for (const step of userJourney) {
        currentTime += step.delay
        const request = {
          ...baseRequest,
          path: step.path,
          timestamp: currentTime
        }
        lastResult = await engine.analyze(request)
      }

      expect(lastResult!.isBot).toBe(false)
      expect(lastResult!.score).toBeLessThan(40)
      expect(lastResult!.recommendation).toBe('allow')
    })

    it('should handle mixed legitimate and suspicious behavior', async () => {
      const baseRequest: BotDetectionRequest = {
        path: '/',
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        ip: '198.51.100.50',
        timestamp: Date.now()
      }

      // Start with normal browsing
      const normalRequests = [
        { path: '/', delay: 0 },
        { path: '/about', delay: 3000 },
        { path: '/contact', delay: 2000 }
      ]

      let currentTime = Date.now()
      for (const step of normalRequests) {
        currentTime += step.delay
        await engine.analyze({
          ...baseRequest,
          path: step.path,
          timestamp: currentTime
        })
      }

      // Then suddenly start rapid suspicious requests
      const suspiciousRequests = [
        '/admin',
        '/wp-admin',
        '/api/users',
        '/.env',
        '/config.php'
      ]

      let lastResult
      for (let i = 0; i < suspiciousRequests.length; i++) {
        currentTime += 200 // Very rapid
        const request = {
          ...baseRequest,
          path: suspiciousRequests[i],
          timestamp: currentTime
        }
        lastResult = await engine.analyze(request)
      }

      // Should detect the suspicious pattern
      expect(lastResult!.score).toBeGreaterThan(30)
      expect(lastResult!.factors.some(f => 
        f.type.includes('PATH') || 
        f.type.includes('TIMING') || 
        f.type.includes('RATE')
      )).toBe(true)
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle high volume of requests efficiently', async () => {
      const startTime = Date.now()
      const numRequests = 100

      for (let i = 0; i < numRequests; i++) {
        const request: BotDetectionRequest = {
          path: `/page-${i}`,
          method: 'GET',
          headers: {
            'user-agent': 'Mozilla/5.0 (test browser)'
          },
          ip: `192.168.1.${i % 50}`, // Rotate through 50 IPs
          timestamp: Date.now() + (i * 100)
        }
        
        await engine.analyze(request)
      }

      const endTime = Date.now()
      const avgTimePerRequest = (endTime - startTime) / numRequests

      // Should process requests quickly (less than 10ms per request on average)
      expect(avgTimePerRequest).toBeLessThan(10)
    })

    it('should maintain session state across multiple requests', async () => {
      const ip = '192.168.1.100'
      const userAgent = 'Mozilla/5.0 (consistent browser)'

      // Make several requests from the same session
      for (let i = 0; i < 5; i++) {
        const request: BotDetectionRequest = {
          path: `/step-${i}`,
          method: 'GET',
          headers: {
            'user-agent': userAgent
          },
          ip,
          timestamp: Date.now() + (i * 1000)
        }
        
        await engine.analyze(request)
      }

      // Check that session data accumulated
      const sessionId = await sessionIdentifier.getSessionId({
        path: '/test',
        method: 'GET',
        headers: { 'user-agent': userAgent },
        ip,
        timestamp: Date.now()
      })

      const sessionData = await storage.getSession(sessionId)
      expect(sessionData).toBeTruthy()
      expect(sessionData!.lastRequests.length).toBe(5)

      // Check that IP data accumulated
      const ipData = await storage.getIP(ip)
      expect(ipData).toBeTruthy()
      expect(ipData!.sessionCount).toBe(1)
      expect(ipData!.activeSessions).toHaveLength(1)
    })
  })

  describe('Configuration Flexibility', () => {
    it('should adapt to different threshold configurations', async () => {
      // Create engine with very strict thresholds
      const strictEngine = new BotDetectionEngine({
        storage: new MemoryAdapter(),
        sessionIdentifier: new H3SessionIdentifier('strict-test'),
        config: {
          thresholds: {
            likelyBot: 20, // Very low threshold
            definitelyBot: 40,
            suspicious: 10
          }
        }
      })

      const mildlyBotRequest: BotDetectionRequest = {
        path: '/admin',
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 (short)'
        },
        ip: '192.168.1.200',
        timestamp: Date.now()
      }

      const result = await strictEngine.analyze(mildlyBotRequest)
      
      // Should be more likely to flag as bot with strict thresholds
      expect(result.isBot).toBe(true)
    })

    it('should handle behavior configuration changes', async () => {
      // Disable most behaviors
      engine.updateBehaviorConfig({
        simple: {
          pathAnalysis: { enabled: false, weight: 1.0 },
          basicTiming: { enabled: false, weight: 1.0 },
          basicRateLimit: { enabled: false, weight: 1.0 },
          basicUserAgent: { enabled: true, weight: 1.0 }, // Keep only user agent
          simplePatterns: { enabled: false, weight: 1.0 },
          basicPositiveSignals: { enabled: false, weight: 1.0 }
        }
      })

      const request: BotDetectionRequest = {
        path: '/admin', // Would normally trigger path analysis
        method: 'GET',
        headers: {
          'user-agent': 'curl/7.68.0' // Should still trigger user agent detection
        },
        ip: '192.168.1.201',
        timestamp: Date.now()
      }

      const result = await engine.analyze(request)
      
      // Should still detect bot based on user agent only
      expect(result.isBot).toBe(true)
      expect(result.factors.some(f => f.type.includes('USER_AGENT'))).toBe(true)
      expect(result.factors.some(f => f.type.includes('PATH'))).toBe(false)
    })
  })
})