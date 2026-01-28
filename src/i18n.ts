import type { ModuleOptions as NuxtI18nOptions } from '@nuxtjs/i18n'
import type { AutoI18nConfig, NormalisedLocales } from './util'
import { getNuxtModuleVersion, hasNuxtModule, hasNuxtModuleCompatibility } from '@nuxt/kit'
import { joinURL, withLeadingSlash, withoutLeadingSlash, withoutTrailingSlash } from 'ufo'
import { getNuxtModuleOptions } from './kit'
import { logger } from './logger'
import { isInternalRoute, mergeOnKey } from './util'

export function generatePathForI18nPages(
  localeCode: string,
  pageLocales: string,
  defaultLocale: string,
  strategy: AutoI18nConfig['strategy'],
) {
  let path = pageLocales
  switch (strategy) {
    case 'prefix_except_default':
    case 'prefix_and_default':
      path = localeCode === defaultLocale ? pageLocales : joinURL(localeCode, pageLocales)
      break
    case 'prefix':
      path = joinURL(localeCode, pageLocales)
      break
  }
  return path
}

export function mapPathForI18nPages(path: string, autoI18n: AutoI18nConfig): string[] | false {
  const pages = autoI18n.pages
  if (!pages || !Object.keys(pages).length)
    return false

  const withoutSlashes = withoutTrailingSlash(withoutLeadingSlash(path)).replace('/index', '')

  // direct match: path matches a page name in i18n pages config
  if (withoutSlashes in pages) {
    const pageLocales = pages[withoutSlashes]
    if (pageLocales) {
      return Object.entries(pageLocales)
        .filter(([, v]) => v !== false)
        .map(([localeCode, localePath]) =>
          withLeadingSlash(generatePathForI18nPages(localeCode, localePath as string, autoI18n.defaultLocale, autoI18n.strategy)),
        )
    }
  }

  // reverse match: path matches a custom locale path (e.g. user specified '/autre-page' which is fr custom path)
  for (const pageLocales of Object.values(pages)) {
    if (!pageLocales)
      continue
    if (autoI18n.defaultLocale in pageLocales && pageLocales[autoI18n.defaultLocale] === path) {
      return Object.entries(pageLocales)
        .filter(([, v]) => v !== false)
        .map(([localeCode, localePath]) =>
          withLeadingSlash(generatePathForI18nPages(localeCode, localePath as string, autoI18n.defaultLocale, autoI18n.strategy)),
        )
    }
  }

  return false
}

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
    normalisedLocales = mergeOnKey((nuxtI18nConfig.locales || []).map((locale: Required<NuxtI18nOptions>['locales'][number]) => typeof locale === 'string' ? { code: locale } : locale), 'code')
    const usingI18nPages = Object.keys(nuxtI18nConfig.pages || {}).length
    const hasI18nConfigForAlternatives = nuxtI18nConfig.differentDomains || usingI18nPages || (nuxtI18nConfig.strategy !== 'no_prefix' && nuxtI18nConfig.locales)
    if (hasI18nConfigForAlternatives) {
      resolvedAutoI18n = {
        differentDomains: nuxtI18nConfig.differentDomains,
        defaultLocale: nuxtI18nConfig.defaultLocale!,
        locales: normalisedLocales,
        strategy: nuxtI18nConfig.strategy as 'prefix' | 'prefix_except_default' | 'prefix_and_default',
        pages: nuxtI18nConfig.pages as Record<string, Record<string, string | false>> | undefined,
      }
    }
  }
  return resolvedAutoI18n
}
