import type { AutoI18nConfig } from '../../src/util'
import { describe, expect, it } from 'vitest'
import { mapPathForI18nPages, splitPathForI18nLocales } from '../../src/i18n'

const i18n = {
  defaultLocale: 'en',
  strategy: 'prefix_except_default',
  locales: [
    { code: 'en' },
    { code: 'fr' },
  ],
} satisfies AutoI18nConfig

describe('mapPathForI18nPages', () => {
  it('keeps the default path beside translated paths', () => {
    expect(mapPathForI18nPages('/about', {
      ...i18n,
      pages: { about: { fr: '/a-propos' } },
    })).toEqual(['/about', '/fr/a-propos'])
  })

  it('keeps the default path when a translation is disabled', () => {
    expect(mapPathForI18nPages('/about', {
      ...i18n,
      pages: { about: { fr: false } },
    })).toEqual(['/about'])
  })
})

describe('multi-domain rules', () => {
  const config = {
    ...i18n,
    multiDomainLocales: true,
    locales: [
      { code: 'en', domains: ['en.example', 'de.example'], defaultForDomains: ['en.example'] },
      { code: 'de', domains: ['de.example'], defaultForDomains: ['de.example'] },
      { code: 'fr' },
    ],
    pages: { private: { en: '/private', de: '/privat', fr: '/prive' } },
  }

  it('seeds the unprefixed path when no host defaults to the global default locale', () => {
    expect(mapPathForI18nPages('/private', {
      ...i18n,
      multiDomainLocales: true,
      locales: [
        { code: 'en' },
        { code: 'de', domains: ['de.example'], defaultForDomains: ['de.example'] },
      ],
      pages: { private: { en: '/private', de: '/privat' } },
    })).toContain('/private')
  })

  it('includes the global default prefix on another locale host', () => {
    expect(new Set(splitPathForI18nLocales('/private', config)))
      .toEqual(new Set(['/private', '/en/private', '/fr/private']))
  })

  it.each(['prefix_except_default', 'prefix_and_default'] as const)('includes translated paths across host defaults with %s', (strategy) => {
    expect(new Set(mapPathForI18nPages('/private', { ...config, strategy }) || []))
      .toEqual(new Set(strategy === 'prefix_and_default'
        ? ['/private', '/en/private', '/privat', '/de/privat', '/fr/prive']
        : ['/private', '/en/private', '/privat', '/fr/prive']))
  })

  it('retains both prefixes on ambiguous hosts and omits disabled translations', () => {
    expect(mapPathForI18nPages('/private', {
      ...config,
      locales: [
        { code: 'en', domains: ['en.example'] },
        { code: 'de', domains: ['shared.example'] },
        { code: 'fr', domains: ['shared.example'] },
        { code: 'it' },
      ],
      pages: { private: { en: '/private', de: '/privat', fr: '/prive', it: false } },
    })).toEqual(['/private', '/de/privat', '/fr/prive'])
  })
})
