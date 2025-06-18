import { computed } from 'vue'
import { useState } from 'nuxt/app'

export interface BotDetectionContext {
  isBot: boolean
  userAgent?: string
  detectionMethod?: 'server' | 'fingerprint'
  lastDetected?: number
  botType?: string
  botName?: string
  trusted?: boolean
}

export function useBotDetection() {
  // Use the same useState key as the plugin
  const botContext = useState<BotDetectionContext | null>('robots:bot-context', () => null)

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
  }
}
