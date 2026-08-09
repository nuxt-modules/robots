import type { AutoI18nConfig } from '../../src/util'
import { describe, expect, it } from 'vitest'
import { mapPathForI18nPages } from '../../src/i18n'

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
