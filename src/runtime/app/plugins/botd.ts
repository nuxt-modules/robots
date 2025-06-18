import type { BotDetectionContext } from '../composables/useBotDetection'
import { useStorage } from '@vueuse/core'
import { defineNuxtPlugin, onNuxtReady, useRequestEvent, useState } from 'nuxt/app'
import { ref } from 'vue'
import { isBotFromHeaders } from '../../../util'

// BotD return types
type BotDetectionResult
  = | {
    bot: true
    botKind: string
  }
  | {
    bot: false
  }

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

export default defineNuxtPlugin({
  setup(nuxtApp) {
    // Use Nuxt's useState for server->client state transfer
    const botContext = useState<BotDetectionContext | null>('robots:bot-context', () => null)

    if (import.meta.server) {
      handleServerDetection(botContext)
    }

    if (import.meta.client) {
      handleClientDetection(nuxtApp, botContext)
    }

    return {
      provide: {
        robotsBotContext: botContext
      }
    }
  },
})

function handleServerDetection(botContext: any) {
  const event = useRequestEvent()
  const headers = event?.node.req.headers || {}
  const detection = isBotFromHeaders(headers)

  if (detection.isBot && detection.data) {
    botContext.value = {
      isBot: true,
      userAgent: headers['user-agent'] as string,
      detectionMethod: 'server',
      botType: detection.data.botType,
      botName: detection.data.botName,
      trusted: detection.data.trusted,
      lastDetected: Date.now(),
    }
  } else {
    // Only set if not already detected (don't override client detection)
    if (!botContext.value) {
      botContext.value = {
        isBot: false,
        userAgent: headers['user-agent'] as string,
        detectionMethod: 'server',
        lastDetected: Date.now(),
      }
    }
  }
}

function handleClientDetection(nuxtApp: any, botContext: any) {
  // Use cached fingerprint result if available
  if (botDetectionStorage.value) {
    botContext.value = botDetectionStorage.value
    return
  }

  // Run fingerprint detection once
  onNuxtReady(async () => {
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

        // Fire Nuxt hook for bot detection
        await nuxtApp.callHook('robots:bot-detected', {
          method: 'fingerprint',
          userAgent: navigator.userAgent,
        })
      }
    }
    catch (error) {
      // Handle errors gracefully
      if (import.meta.dev) {
        console.warn('[Bot Detection] Client-side detection failed:', error)
      }

      // Fire error hook
      await nuxtApp.callHook('robots:bot-detection-error', { error })
    }
  })
}
