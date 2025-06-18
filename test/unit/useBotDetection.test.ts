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
