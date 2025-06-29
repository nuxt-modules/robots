import type { BotDetectionContext, UseBotDetectionOptions, UseBotDetectionReturn } from '../../types'
import { getHeaders } from 'h3'
import { useRequestEvent, useState } from 'nuxt/app'
import { computed } from 'vue'
import { getBotDetection as getBotDetectionFromHeaders } from '../../../util'
import { runFingerprinting } from '../utils/fingerprinting'

export function useBotDetection(options: UseBotDetectionOptions = {}): UseBotDetectionReturn {
  const botContext = useState<BotDetectionContext | null>('robots:bot-context', () => {
    // Initialize server-side detection on first call
    if (import.meta.server) {
      const event = useRequestEvent()
      if (event) {
        const headers = getHeaders(event) || {}
        return getBotDetectionFromHeaders(headers)
      }
    }

    return null
  })

  // Automatically run fingerprinting if enabled and on client
  if (options.fingerprint && import.meta.client) {
    // Skip if server already detected a bot
    if (!botContext.value?.isBot) {
      runFingerprinting().then(([result, error]) => {
        if (error) {
          options?.onFingerprintError?.(error)
        }
        else {
          // Update context with fingerprinting result
          if (result) {
            botContext.value = result
          }
          else {
            // No bot detected, update context to reflect fingerprinting ran
            botContext.value = {
              isBot: false,
              trusted: false,
            }
          }
        }
      })
    }
  }

  return {
    // Whether we've detected a bot
    isBot: computed(() => botContext.value?.isBot ?? false),

    // Bot type
    botType: computed(() => botContext.value?.botType),

    // Whether the bot is trusted
    trusted: computed(() => botContext.value?.trusted),

    // Clear detection state
    reset: () => {
      botContext.value = null
    },
  }
}
