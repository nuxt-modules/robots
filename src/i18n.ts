import type { NuxtI18nOptions } from '@nuxtjs/i18n/dist/module'
import type { AutoI18nConfig, NormalisedLocales } from './runtime/types'
import { getNuxtModuleVersion, hasNuxtModule, hasNuxtModuleCompatibility } from '@nuxt/kit'
import { getNuxtModuleOptions } from './kit'
import { logger } from './logger'
import { isInternalRoute, mergeOnKey } from './runtime/util'

export function splitPathForI18nLocales(path: string, autoI18n: AutoI18nConfig) {
  const locales = autoI18n.strategy === 'prefix_except_default' ? autoI18n.locales.filter(l => l.code !== autoI18n.defaultLocale) : autoI18n.locales
  if (!path || isInternalRoute(path))
    return path
  const match = path.match(new RegExp(`^/(${locales.map(l => l.code).join('|')})(.*)`))
  const locale = match?.[1]
  // only accept paths without locale
  if (locale)
    return path
  return [
    // always add the original route to avoid redirects
    path,
    ...locales.map(l => `/${l.code}${path}`),
  ]
}

export async function resolveI18nConfig() {
  let nuxtI18nConfig: NuxtI18nOptions = {}
  let resolvedAutoI18n: false | AutoI18nConfig = false
  let normalisedLocales: NormalisedLocales = []
  if (hasNuxtModule('@nuxtjs/i18n')) {
    const i18nVersion = await getNuxtModuleVersion('@nuxtjs/i18n')
    if (!await hasNuxtModuleCompatibility('@nuxtjs/i18n', '>=8'))
      logger.warn(`You are using @nuxtjs/i18n v${i18nVersion}. For the best compatibility, please upgrade to @nuxtjs/i18n v8.0.0 or higher.`)
    nuxtI18nConfig = (await getNuxtModuleOptions('@nuxtjs/i18n') || {}) as NuxtI18nOptions
    normalisedLocales = mergeOnKey((nuxtI18nConfig.locales || []).map(locale => typeof locale === 'string' ? { code: locale } : locale), 'code')
    const usingI18nPages = Object.keys(nuxtI18nConfig.pages || {}).length
    const hasI18nConfigForAlternatives = nuxtI18nConfig.differentDomains || usingI18nPages || (nuxtI18nConfig.strategy !== 'no_prefix' && nuxtI18nConfig.locales)
    if (hasI18nConfigForAlternatives) {
      resolvedAutoI18n = {
        differentDomains: nuxtI18nConfig.differentDomains,
        defaultLocale: nuxtI18nConfig.defaultLocale!,
        locales: normalisedLocales,
        strategy: nuxtI18nConfig.strategy as 'prefix' | 'prefix_except_default' | 'prefix_and_default',
      }
    }
  }
  return resolvedAutoI18n
}
