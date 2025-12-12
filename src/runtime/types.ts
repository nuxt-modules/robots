import type { BotCategory, BotName } from '@nuxtjs/robots/util'
import type { H3Event } from 'h3'
import type { ComputedRef } from 'vue'

export type Arrayable<T> = T | T[]

/**
 * Robot directive presets with their corresponding values
 */
export interface RobotDirectives {
  /** Allows indexing and following links with maximum preview settings */
  'enabled': boolean
  /** Prevents indexing and following links */
  'disabled': boolean
  /** Allows search engines to index the page */
  'index': boolean
  /** Prevents search engines from indexing the page */
  'noindex': boolean
  /** Allows search engines to follow links on the page */
  'follow': boolean
  /** Prevents search engines from following links on the page */
  'nofollow': boolean
  /** Prevents all indexing and following (equivalent to noindex, nofollow) */
  'none': boolean
  /** Allows all indexing and following (equivalent to index, follow) */
  'all': boolean
  /** Non-standard: Requests AI crawlers not to use content for training */
  'noai': boolean
  /** Non-standard: Requests AI crawlers not to use images for training */
  'noimageai': boolean
  /** Controls the size of image previews in search results */
  'max-image-preview': 'none' | 'standard' | 'large'
  /** Controls the maximum text snippet length in search results (-1 for no limit) */
  'max-snippet': number
  /** Controls the maximum video preview length in seconds (-1 for no limit) */
  'max-video-preview': number
}

/**
 * Base type for robot directive values
 */
export type RobotsValue = boolean | string | Partial<RobotDirectives>

/**
 * Content-Usage preference value (y = allow, n = disallow)
 * @see https://datatracker.ietf.org/doc/draft-ietf-aipref-vocab/
 */
export type ContentUsageValue = 'y' | 'n'

/**
 * Content-Signal preference value (yes = allow, no = disallow)
 * @see https://www.ietf.org/archive/id/draft-romm-aipref-contentsignals-00.html
 */
export type ContentSignalValue = 'yes' | 'no'

/**
 * Content-Usage categories (IETF aipref-vocab)
 * @see https://ietf-wg-aipref.github.io/drafts/draft-ietf-aipref-vocab.html
 */
export interface ContentUsagePreferences {
  /** Automated Processing */
  'bots'?: ContentUsageValue
  /** Foundation Model Production */
  'train-ai'?: ContentUsageValue
  /** AI Output */
  'ai-output'?: ContentUsageValue
  /** Search */
  'search'?: ContentUsageValue
}

/**
 * Content-Signal categories (IETF aipref-contentsignals)
 * @see https://www.ietf.org/archive/id/draft-romm-aipref-contentsignals-00.html
 */
export interface ContentSignalPreferences {
  /** Search */
  'search'?: ContentSignalValue
  /** AI Input (RAG, grounding, generative AI search) */
  'ai-input'?: ContentSignalValue
  /** AI Training (training or fine-tuning models) */
  'ai-train'?: ContentSignalValue
}

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
  contentUsage?: Arrayable<string> | Partial<ContentUsagePreferences>
  contentSignal?: Arrayable<string> | Partial<ContentSignalPreferences>
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
  // https://datatracker.ietf.org/doc/draft-ietf-aipref-attach/
  contentUsage?: string[]
  // https://contentsignals.org/
  contentSignal?: string[]
  // nuxt-simple-robots internals
  _skipI18n?: boolean
  // runtime optimization
  _indexable?: boolean
  _rules?: { pattern: string, allow: boolean }[]
  _normalized?: boolean
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
