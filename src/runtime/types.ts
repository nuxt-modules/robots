import type { H3Event } from 'h3'

export type Arrayable<T> = T | T[]

export interface ParsedRobotsTxt {
  groups: RobotsGroupResolved[]
  sitemaps: string[]
}

export type RobotsGroupInput = GoogleInput | YandexInput

export interface GoogleInput {
  comment?: Arrayable<string>
  disallow?: Arrayable<string>
  allow?: Arrayable<string>
  userAgent?: Arrayable<string>
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
}

export interface HookRobotsTxtContext {
  robotsTxt: string
  e: H3Event
}

export interface HookRobotsConfigContext extends ParsedRobotsTxt {
  event?: H3Event
  context: 'robots.txt' | 'init'
}

export type NormalisedLocales = { code: string, iso?: string, domain?: string }[]
export interface AutoI18nConfig {
  differentDomains?: boolean
  locales: NormalisedLocales
  defaultLocale: string
  strategy: 'prefix' | 'prefix_except_default' | 'prefix_and_default' | 'no_prefix'
}
