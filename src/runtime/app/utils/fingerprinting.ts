import type { BotDetectionResult } from '@fingerprintjs/botd'
import type { BotDetectionContext } from '@nuxtjs/robots/util'
import { mapBotKindToCategory } from '@nuxtjs/robots/util'
import { useStorage } from '@vueuse/core'
import { ref } from 'vue'

// Persistent storage for client-side fingerprint detection results only
const botDetectionStorage = import.meta.client
  ? useStorage<BotDetectionContext | null>('__nuxt_robots:botd', null, localStorage, {
      serializer: {
        read: (value: string) => {
          try {
            return JSON.parse(value)
          }
          catch {
            return null
          }
        },
        write: (value: any) => JSON.stringify(value),
      },
    })
  : ref<BotDetectionContext | null>(null)

export async function runFingerprinting(): Promise<[BotDetectionContext | false, Error | null]> {
  // Use cached result if available
  if (botDetectionStorage.value) {
    return [botDetectionStorage.value, null]
  }

  try {
    const { load } = await import('@fingerprintjs/botd').catch(() => ({
      load: () => Promise.resolve({ detect: () => ({ bot: false }) }),
    }))

    // Initialize BotD agent
    const botdAgent = await load().catch(() => ({
      detect: () => ({ bot: false }),
    }))

    // Perform detection
    const result = botdAgent.detect() as BotDetectionResult
    const isBot = result.bot

    const fingerprintResult = {
      isBot: result.bot,
      botName: result.bot ? result.botKind : undefined,
      botCategory: result.bot ? mapBotKindToCategory(result.botKind) : undefined,
      trusted: false,
    }

    // Store in persistent storage if bot detected
    if (isBot) {
      botDetectionStorage.value = fingerprintResult
    }

    return [isBot ? fingerprintResult : false, null]
  }
  catch (error) {
    return [false, error instanceof Error ? error : new Error(String(error))]
  }
}
