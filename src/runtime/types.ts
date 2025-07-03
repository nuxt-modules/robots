import type { H3Event } from 'h3'
import type { ComputedRef } from 'vue'
import type { BotCategory, BotName } from '../const-bots'

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
  detectionMethod?: 'headers' | 'fingerprint'
  botName?: BotName
  botCategory?: BotCategory
  trusted?: boolean
}

// Hook payload for fingerprinting bot detection events
export interface FingerprintingBotDetectedPayload {
  method: 'fingerprint'
  result: BotDetectionContext
  fingerprint: BotDetectionData
}

export interface FingerprintingErrorPayload {
  error: any
}

// Simplified bot info interface for composable API
export interface BotInfo {
  name?: BotName
  category?: BotCategory
  trusted?: boolean
  method?: 'server' | 'fingerprint'
}

// Options for useBotDetection composable
export interface UseBotDetectionOptions {
  fingerprint?: boolean
  onFingerprintError?: (error: Error) => void
  onFingerprintResult?: (result: BotDetectionContext | null) => void
}

// Return type for useBotDetection composable
export interface UseBotDetectionReturn {
  isBot: ComputedRef<boolean>
  botName: ComputedRef<BotName | undefined>
  botCategory: ComputedRef<BotCategory | undefined>
  trusted: ComputedRef<boolean | undefined>
  reset: () => void
}

export type NormalisedLocales = { code: string, iso?: string, domain?: string }[]
export interface AutoI18nConfig {
  differentDomains?: boolean
  locales: NormalisedLocales
  defaultLocale: string
  strategy: 'prefix' | 'prefix_except_default' | 'prefix_and_default' | 'no_prefix'
}

export interface BotScoreData {
  total: number
  count: number
  average: number
}

export interface DailyBotStats {
  [date: string]: {
    count: number
    bots: Record<string, number>
    scores?: Record<string, BotScoreData>
    hourly?: number[] // 24 elements array for hourly distribution
    paths?: Record<string, Record<string, number>> // Bot type -> path -> count
    sources?: Record<string, number> // Detection source -> count
  }
}

export interface RobotsContext {
  rule: string
  indexable: boolean
  debug?: { source: string, line?: string }
}

export interface NuxtRobotsRuntimeConfig {
  version: string
  isNuxtContentV2: boolean
  debug: boolean
  credits: boolean
  groups: RobotsGroupResolved[]
  sitemap: string[]
  header: boolean
  robotsEnabledValue: string
  robotsDisabledValue: string
  cacheControl: string | false
  botDetection: boolean
}

export interface BotDetectionData {
  isBot: boolean
  data?: {
    botName: BotName
    botCategory: BotCategory
    trusted: boolean
  }
}

export interface PatternMapValue {
  botName: BotName
  botCategory: BotCategory
  trusted: boolean
}
