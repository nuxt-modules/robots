import { useStorage } from '@vueuse/core'
import { computed, ref } from 'vue'

export interface BotDetectionContext {
  isBot: boolean
  userAgent?: string
  headers?: {
    accept?: string
    acceptLanguage?: string
    acceptEncoding?: string
  }
  detectionMethod?: 'server' | 'client' | 'fingerprint'
  confidence?: number
  lastDetected?: number
  botType?: string
  botName?: string
  trusted?: boolean
}

// Global state for bot detection
const botContextState = ref<BotDetectionContext | null>(null)

// Persistent storage for client-side detection results
const botDetectionStorage = useStorage<{
  hasRun: boolean
  lastDetectionTime: number
  clientDetectionResult?: BotDetectionContext
}>('__nuxt_robots:botd', {
  hasRun: false,
  lastDetectionTime: 0,
}, localStorage, {
  serializer: {
    read: (value: string) => {
      try {
        return JSON.parse(value)
      }
      catch {
        return { hasRun: false, lastDetectionTime: 0 }
      }
    },
    write: (value: any) => JSON.stringify(value),
  },
})

export function useBotDetection() {
  return {
    // Current bot detection context
    context: computed(() => botContextState.value),

    // Whether we've detected a bot
    isBot: computed(() => botContextState.value?.isBot ?? false),

    // Bot details if available
    botInfo: computed(() => {
      const ctx = botContextState.value
      if (!ctx || !ctx.isBot)
        return null
      return {
        type: ctx.botType,
        name: ctx.botName,
        trusted: ctx.trusted,
        confidence: ctx.confidence,
        method: ctx.detectionMethod,
      }
    }),

    // Persistent storage state
    storage: botDetectionStorage,

    // Update the detection context
    updateContext: (newContext: BotDetectionContext) => {
      botContextState.value = {
        ...newContext,
        lastDetected: Date.now(),
      }
    },

    // Clear detection state
    reset: () => {
      botContextState.value = null
      botDetectionStorage.value = {
        hasRun: false,
        lastDetectionTime: 0,
      }
    },
  }
}
