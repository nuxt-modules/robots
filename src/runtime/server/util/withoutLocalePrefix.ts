import type { RuntimeI18nConfig } from 'nuxtseo-shared/i18n-runtime'
import { resolveLocaleFromRoute } from 'nuxtseo-shared/i18n-runtime'

// The module loads this file only when the app uses i18n. Other apps get an identity function.

const i18nStrategies = new Set<RuntimeI18nConfig['strategy']>(['no_prefix', 'prefix_except_default', 'prefix', 'prefix_and_default'])

function parseRuntimeI18nConfig(input: unknown): RuntimeI18nConfig | null {
  if (!input || typeof input !== 'object')
    return null
  const config = input as Record<string, unknown>
  if (!Array.isArray(config.locales))
    return null
  const locales = config.locales.flatMap((locale) => {
    const code = typeof locale === 'string'
      ? locale
      : locale && typeof locale === 'object' && typeof (locale as Record<string, unknown>).code === 'string'
        ? (locale as Record<string, string>).code
        : null
    return code ? [{ code, hreflang: code }] : []
  })
  if (!locales.length)
    return null
  const defaultLocale = typeof config.defaultLocale === 'string' ? config.defaultLocale : locales[0]!.code
  const strategy = typeof config.strategy === 'string' && i18nStrategies.has(config.strategy as RuntimeI18nConfig['strategy'])
    ? config.strategy as RuntimeI18nConfig['strategy']
    : 'prefix'
  return { defaultLocale, locales, strategy }
}

/**
 * Remove the locale prefix from a path, so a route rule for `/secret` matches `/fr/secret`.
 * Returns the path unchanged when the public runtime config has no i18n locales.
 */
export function withoutLocalePrefix(path: string, publicRuntimeConfig: Record<string, unknown>): string {
  const i18nConfig = parseRuntimeI18nConfig(publicRuntimeConfig.i18n)
  return i18nConfig ? resolveLocaleFromRoute(path, i18nConfig).basePath : path
}
