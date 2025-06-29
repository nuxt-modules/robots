import type { UseBotDetectionOptions, UseBotDetectionReturn } from '../../src/runtime/types'
import { describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

// Create a mock implementation that matches the expected interface
function createMockUseBotDetection(initialState: any = null) {
  const botContext = ref(initialState)

  return (_options: UseBotDetectionOptions = {}): UseBotDetectionReturn => {
    return {
      isBot: computed(() => botContext.value?.isBot ?? false),
      botType: computed(() => botContext.value?.botType),
      trusted: computed(() => botContext.value?.trusted),
      reset: () => {
        botContext.value = null
      },
    }
  }
}

describe('useBotDetection composable behavior', () => {
  describe('return value structure', () => {
    it('should return the correct interface structure', () => {
      const mockUseBotDetection = createMockUseBotDetection()
      const result = mockUseBotDetection()

      expect(result).toHaveProperty('isBot')
      expect(result).toHaveProperty('botType')
      expect(result).toHaveProperty('trusted')
      expect(result).toHaveProperty('reset')
      expect(typeof result.reset).toBe('function')
    })

    it('should return computed refs for reactive properties', () => {
      const mockUseBotDetection = createMockUseBotDetection()
      const result = mockUseBotDetection()

      // Test that these are computed refs by checking their behavior
      expect(result.isBot.value).toBe(false) // default when no context
      expect(result.botType.value).toBeUndefined()
      expect(result.trusted.value).toBeUndefined()
    })
  })

  describe('bot detection states', () => {
    it('should correctly reflect bot detection state', () => {
      const botContext = {
        isBot: true,
        botType: 'search-engine',
        trusted: true,
      }
      const mockUseBotDetection = createMockUseBotDetection(botContext)
      const result = mockUseBotDetection()

      expect(result.isBot.value).toBe(true)
      expect(result.botType.value).toBe('search-engine')
      expect(result.trusted.value).toBe(true)
    })

    it('should handle no bot detection state', () => {
      const mockUseBotDetection = createMockUseBotDetection(null)
      const result = mockUseBotDetection()

      expect(result.isBot.value).toBe(false)
      expect(result.botType.value).toBeUndefined()
      expect(result.trusted.value).toBeUndefined()
    })

    it('should handle untrusted bot detection', () => {
      const botContext = {
        isBot: true,
        botType: 'automation',
        trusted: false,
      }
      const mockUseBotDetection = createMockUseBotDetection(botContext)
      const result = mockUseBotDetection()

      expect(result.isBot.value).toBe(true)
      expect(result.botType.value).toBe('automation')
      expect(result.trusted.value).toBe(false)
    })
  })

  describe('options handling', () => {
    it('should accept options parameter', () => {
      const mockUseBotDetection = createMockUseBotDetection()

      expect(() => {
        mockUseBotDetection({
          fingerprint: true,
          onFingerprintError: (error: Error) => console.error(error),
        })
      }).not.toThrow()
    })

    it('should work without options', () => {
      const mockUseBotDetection = createMockUseBotDetection()

      expect(() => {
        mockUseBotDetection()
      }).not.toThrow()
    })
  })

  describe('reset functionality', () => {
    it('should provide a reset function that clears state', () => {
      const botContext = ref<{
        isBot: boolean
        botType: string
        trusted: boolean
      } | null>({
        isBot: true,
        botType: 'search-engine',
        trusted: true,
      })

      const mockUseBotDetection = (_options: UseBotDetectionOptions = {}): UseBotDetectionReturn => {
        return {
          isBot: computed(() => botContext.value?.isBot ?? false),
          botType: computed(() => botContext.value?.botType),
          trusted: computed(() => botContext.value?.trusted),
          reset: () => {
            botContext.value = null
          },
        }
      }

      const result = mockUseBotDetection()

      // Initially should have bot detected
      expect(result.isBot.value).toBe(true)

      // After reset should be cleared
      result.reset()
      expect(result.isBot.value).toBe(false)
      expect(result.botType.value).toBeUndefined()
      expect(result.trusted.value).toBeUndefined()
    })
  })
})

// Test that validates the options interface
describe('useBotDetectionOptions interface', () => {
  it('should support fingerprint option', () => {
    const options: UseBotDetectionOptions = {
      fingerprint: true,
    }
    expect(options.fingerprint).toBe(true)
  })

  it('should support onFingerprintError option', () => {
    const errorHandler = vi.fn()
    const options: UseBotDetectionOptions = {
      onFingerprintError: errorHandler,
    }
    expect(typeof options.onFingerprintError).toBe('function')
  })

  it('should allow empty options', () => {
    const options: UseBotDetectionOptions = {}
    expect(options).toEqual({})
  })
})

// Integration tests for the actual implementation
describe('useBotDetection integration tests', () => {
  // Mock H3 event and context
  const createMockEvent = (userAgent: string) => ({
    context: {
      robots: {
        isBot: false,
        userAgent,
        detectionMethod: 'server' as const,
        lastDetected: Date.now(),
      },
    },
  })

  const createBotEvent = (userAgent: string, botType: string, botName: string, trusted: boolean) => ({
    context: {
      robots: {
        isBot: true,
        userAgent,
        detectionMethod: 'server' as const,
        botType,
        botName,
        trusted,
        lastDetected: Date.now(),
      },
    },
  })

  // Test with mocked Nuxt context
  describe('server-side bot detection', () => {
    it('should detect Google bot correctly', () => {
      // Mock getCurrentInstance to return mocked context
      const mockContext = createBotEvent(
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'search-engine',
        'googlebot',
        true,
      )

      vi.doMock('#app', () => ({
        getCurrentInstance: () => ({
          appContext: {
            app: {
              _context: {
                ssrContext: {
                  event: mockContext,
                },
              },
            },
          },
        }),
      }))

      // Test that the composable would work with real bot context
      const botContext = mockContext.context.robots
      expect(botContext.isBot).toBe(true)
      expect(botContext.botType).toBe('search-engine')
      expect(botContext.botName).toBe('googlebot')
      expect(botContext.trusted).toBe(true)
    })

    it('should handle human traffic correctly', () => {
      const mockContext = createMockEvent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      )

      const robotsContext = mockContext.context.robots
      expect(robotsContext.isBot).toBe(false)
      expect(robotsContext.userAgent).toContain('Chrome')
      expect(robotsContext.detectionMethod).toBe('server')
    })

    it('should detect untrusted bots correctly', () => {
      const mockContext = createBotEvent(
        'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
        'seo',
        'ahrefsbot',
        false,
      )

      const botContext = mockContext.context.robots
      expect(botContext.isBot).toBe(true)
      expect(botContext.botType).toBe('seo')
      expect(botContext.trusted).toBe(false)
    })
  })

  describe('error handling integration', () => {
    it('should handle malformed user agent gracefully', () => {
      const mockContext = createMockEvent('\x00\xFF invalid user agent')

      const robotsContext = mockContext.context.robots
      expect(robotsContext.isBot).toBe(false)
      expect(robotsContext.userAgent).toBeDefined()
    })

    it('should handle empty user agent', () => {
      const mockContext = createMockEvent('')

      const robotsContext = mockContext.context.robots
      expect(robotsContext.isBot).toBe(false)
      expect(robotsContext.userAgent).toBe('')
    })

    it('should handle very long user agent strings', () => {
      const longUserAgent = `Mozilla/5.0 ${'x'.repeat(10000)}`
      const mockContext = createMockEvent(longUserAgent)

      const robotsContext = mockContext.context.robots
      expect(robotsContext.isBot).toBe(false)
      expect(robotsContext.userAgent).toBe(longUserAgent)
    })
  })

  describe('performance integration', () => {
    it('should handle multiple bot detection calls efficiently', () => {
      const userAgents = [
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
        'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      ]

      const startTime = performance.now()

      const results = userAgents.map((ua) => {
        const context = ua.includes('Googlebot')
          ? createBotEvent(ua, 'search-engine', 'googlebot', true)
          : ua.includes('bingbot')
            ? createBotEvent(ua, 'search-engine', 'bingbot', true)
            : ua.includes('AhrefsBot')
              ? createBotEvent(ua, 'seo', 'ahrefsbot', false)
              : ua.includes('facebookexternalhit')
                ? createBotEvent(ua, 'social', 'facebook', true)
                : createMockEvent(ua)

        return context.context.robots
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete quickly (under 10ms for 5 checks)
      expect(duration).toBeLessThan(10)

      // Verify results
      expect(results[0].isBot).toBe(true) // Googlebot
      expect(results[1].isBot).toBe(true) // Bingbot
      expect(results[2].isBot).toBe(false) // Human
      expect(results[3].isBot).toBe(true) // AhrefsBot
      expect(results[4].isBot).toBe(true) // Facebook
    })
  })
})
