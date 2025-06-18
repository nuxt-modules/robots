import type { BotDetectionResult } from '@fingerprintjs/botd'
import type { BotDetectionContext } from '../../../util'
import { useStorage } from '@vueuse/core'
import { useNuxtApp } from 'nuxt/app'
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

export async function runFingerprinting(botContext: any): Promise<BotDetectionContext | false> {
  // Skip if server already detected a bot
  if (botContext.value?.isBot) {
    return false
  }

  // Use cached result if available
  if (botDetectionStorage.value) {
    botContext.value = botDetectionStorage.value
    return botDetectionStorage.value
  }

  const nuxtApp = useNuxtApp()
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
    const botKind = result.bot ? result.botKind : undefined

    // Only store if bot detected
    if (isBot) {
      const fingerprintResult = {
        isBot: true,
        userAgent: navigator.userAgent,
        detectionMethod: 'fingerprint' as const,
        botType: 'automation',
        botName: botKind,
        trusted: false,
        lastDetected: Date.now(),
      }

      botDetectionStorage.value = fingerprintResult
      botContext.value = fingerprintResult

      // Fire Nuxt hook for bot detection with full fingerprint data
      await nuxtApp.callHook('robots:fingerprinting:bot-detected', {
        method: 'fingerprint',
        result: fingerprintResult,
        fingerprint: result, // Official @fingerprintjs/botd BotDetectionResult
      })

      return fingerprintResult
    }
    return false
  }
  catch (error) {
    // Handle errors gracefully
    if (import.meta.dev) {
      console.warn('[Bot Detection] Client-side detection failed:', error)
    }
    // Fire error hook
    await nuxtApp.callHook('robots:fingerprinting:error', { error })
    return false
  }
}
