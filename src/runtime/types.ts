import type { BotDetectionResult } from '@fingerprintjs/botd'
import type { H3Event } from 'h3'
import type { ComputedRef } from 'vue'

export type Arrayable<T> = T | T[]

export interface ParsedRobotsTxt {
  groups: RobotsGroupResolved[]
  sitemaps: string[]
  errors: string[]
}

export type RobotsGroupInput = GoogleInput | YandexInput

// google is the base input
export interface GoogleInput {
  comment?: Arrayable<string>
  disallow?: Arrayable<string>
  allow?: Arrayable<string>
  userAgent?: Arrayable<string>
  // nuxt-simple-robots internals
  _skipI18n?: boolean
}

export interface YandexInput extends GoogleInput {
  cleanParam?: Arrayable<string>
}

export interface RobotsGroupResolved {
  comment: string[]
  disallow: string[]
  allow: string[]
  userAgent: string[]
  host?: string
  // yandex only
  cleanParam?: string[]
  // nuxt-simple-robots internals
  _skipI18n?: boolean
  // runtime optimization
  _indexable?: boolean
  _rules?: { pattern: string, allow: boolean }[]
}

export interface HookRobotsTxtContext {
  robotsTxt: string
  e: H3Event
}

export interface HookRobotsConfigContext extends ParsedRobotsTxt {
  event?: H3Event
  context: 'robots.txt' | 'init'
}

// Bot Detection Types
export interface BotDetectionContext {
  isBot: boolean
  userAgent?: string
  detectionMethod?: 'server' | 'fingerprint'
  lastDetected?: number
  botType?: string
  botName?: string
  trusted?: boolean
}

// Hook payload for fingerprinting bot detection events
export interface FingerprintingBotDetectedPayload {
  method: 'fingerprint'
  result: BotDetectionContext
  fingerprint: BotDetectionResult
}

export interface FingerprintingErrorPayload {
  error: any
}

// Simplified bot info interface for composable API
export interface BotInfo {
  type?: string
  name?: string
  trusted?: boolean
  method?: 'server' | 'fingerprint'
}

// Return type for useBotDetection composable
export interface UseBotDetectionReturn {
  context: ComputedRef<BotDetectionContext | null>
  isBot: ComputedRef<boolean>
  botInfo: ComputedRef<BotInfo | null>
  updateContext: (newContext: BotDetectionContext) => void
  reset: () => void
  enableFingerprinting: () => Promise<BotDetectionContext | false>
}

export type NormalisedLocales = { code: string, iso?: string, domain?: string }[]
export interface AutoI18nConfig {
  differentDomains?: boolean
  locales: NormalisedLocales
  defaultLocale: string
  strategy: 'prefix' | 'prefix_except_default' | 'prefix_and_default' | 'no_prefix'
}

export interface RobotsContext {
  rule: string
  indexable: boolean
  debug?: { source: string, line?: string }
}
