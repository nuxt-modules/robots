import type { NuxtI18nOptions } from '@nuxtjs/i18n'
import type { AutoI18nConfig as SharedAutoI18nConfig } from 'nuxtseo-shared/i18n'
import type { AutoI18nConfig } from './util'
// re-import for local use in mapPathForI18nPages
import { generatePathForI18nPages } from 'nuxtseo-shared/i18n'
import { withLeadingSlash, withoutLeadingSlash, withoutTrailingSlash } from 'ufo'

export { generatePathForI18nPages, resolveI18nConfig, splitPathForI18nLocales } from 'nuxtseo-shared/i18n'

export function mapPathForI18nPages(path: string, autoI18n: AutoI18nConfig): string[] | false {
  const pages = autoI18n.pages
  if (!pages || !Object.keys(pages).length)
    return false

  const withoutSlashes = withoutTrailingSlash(withoutLeadingSlash(path)).replace('/index', '')

  function resolveForAllLocales(pageName: string, pageLocales: Record<string, string | false>): string[] {
    return autoI18n.locales
      .filter((l) => {
        // skip disabled locales
        if (l.code in pageLocales && pageLocales[l.code] === false)
          return false
        // skip default locale for prefix_except_default
        if (autoI18n.strategy === 'prefix_except_default' && l.code === autoI18n.defaultLocale)
          return false
        return true
      })
      .map((l) => {
        // use custom path if defined, otherwise fall back to page name as path
        const localePath = (l.code in pageLocales && pageLocales[l.code] !== false)
          ? pageLocales[l.code] as string
          : `/${pageName}`
        return withLeadingSlash(generatePathForI18nPages({
          localeCode: l.code,
          pageLocales: localePath,
          nuxtI18nConfig: { strategy: autoI18n.strategy, defaultLocale: autoI18n.defaultLocale } as NuxtI18nOptions,
          normalisedLocales: autoI18n.locales as SharedAutoI18nConfig['locales'],
        }))
      })
  }

  // direct match: path matches a page name in i18n pages config
  if (withoutSlashes in pages) {
    const pageLocales = pages[withoutSlashes]
    if (pageLocales)
      return resolveForAllLocales(withoutSlashes, pageLocales)
  }

  // reverse match: path matches a custom locale path (e.g. user specified '/autre-page' which is fr custom path)
  for (const [pageName, pageLocales] of Object.entries(pages)) {
    if (!pageLocales)
      continue
    if (autoI18n.defaultLocale in pageLocales && pageLocales[autoI18n.defaultLocale] === path)
      return resolveForAllLocales(pageName, pageLocales)
  }

  return false
}
