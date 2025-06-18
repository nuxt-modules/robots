import { useRequestEvent, useState } from 'nuxt/app'
import { computed } from 'vue'
import { runFingerprinting } from '../utils/fingerprinting'

// Re-export types for users
export type { BotDetectionContext, BotInfo, UseBotDetectionReturn } from '../../types'
import type { BotDetectionContext, UseBotDetectionReturn } from '../../types'
import { getHeaders } from 'h3'
import { getBotDetection as getBotDetectionFromHeaders } from '../../../util'

export function useBotDetection(): UseBotDetectionReturn {
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

  return {
    // Current bot detection context
    context: computed(() => botContext.value),

    // Whether we've detected a bot
    isBot: computed(() => botContext.value?.isBot ?? false),

    // Bot details if available
    botInfo: computed(() => {
      const ctx = botContext.value
      if (!ctx || !ctx.isBot)
        return null
      return {
        type: ctx.botType,
        name: ctx.botName,
        trusted: ctx.trusted,
        method: ctx.detectionMethod,
      }
    }),

    // Update the detection context (for manual updates)
    updateContext: (newContext: BotDetectionContext) => {
      botContext.value = {
        ...newContext,
        lastDetected: Date.now(),
      }
    },

    // Clear detection state
    reset: () => {
      botContext.value = null
    },

    // Manually run fingerprinting detection
    enableFingerprinting: async (): Promise<BotDetectionContext | false> => {
      if (import.meta.client) {
        return runFingerprinting(botContext)
      }
      // Fingerprinting is client-side only
      return Promise.resolve(false)
    },
  }
}
