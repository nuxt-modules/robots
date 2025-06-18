import { useState } from 'nuxt/app'

export interface BotDetectionContext {
  isBot: boolean
  userAgent?: string
  headers?: {
    accept?: string
    acceptLanguage?: string
    acceptEncoding?: string
  }
}

export function useBotDetection() {
  return useState<BotDetectionContext | null>('botContext', () => null)
}