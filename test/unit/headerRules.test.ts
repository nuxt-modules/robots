import { describe, expect, it } from 'vitest'
import { resolveRobotsHeaderRules } from '../../src/header-rules'
import { isNoIndexRule } from '../../src/util'

const buildAssetRules = {
  '/_nuxt': { robots: 'noindex' },
  '/_nuxt/**': { robots: 'noindex' },
}

const enabledValue = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'

function resolve(routeRules: Record<string, any>, indexable = true) {
  return resolveRobotsHeaderRules({
    routeRules: { ...routeRules, ...buildAssetRules },
    indexable,
    robotsEnabledValue: enabledValue,
    robotsDisabledValue: 'noindex, nofollow',
    buildAssetsDir: '/_nuxt/',
  })
}

describe('resolveRobotsHeaderRules', () => {
  it('sends one site-wide rule for a non-indexable site', () => {
    expect(resolve({ '/secret/**': { robots: 'noindex' }, '/open': { robots: true } }, false))
      .toEqual({ '/**': 'noindex, nofollow' })
  })

  it('keeps the build asset rules when no user rule covers them', () => {
    expect(resolve({})).toEqual({ '/_nuxt': 'noindex', '/_nuxt/**': 'noindex' })
  })

  it('sends the disabled value for a `robots: false` rule', () => {
    expect(resolve({ '/secret/**': { robots: false } })).toMatchObject({ '/secret/**': 'noindex, nofollow' })
  })

  it('sends the rule or enabled value for indexable rules', () => {
    expect(resolve({ '/open/**': { robots: true }, '/custom': { robots: 'index, follow' } }))
      .toEqual({
        '/open/**': enabledValue,
        '/custom': 'index, follow',
        '/_nuxt': 'noindex',
        '/_nuxt/**': 'noindex',
      })
  })

  it('stops a catch-all noindex rule from covering an allowed route', () => {
    // Nitro merges the explicit allow over the catch-all, but static hosts apply every
    // matching rule. The catch-all must drop out so the allowed route is indexable.
    expect(resolve({ '/**': { robots: false }, '/': { robots: true } }))
      .toEqual({ '/': enabledValue, '/_nuxt': 'noindex', '/_nuxt/**': 'noindex' })
  })

  it('keeps a noindex rule that does not cover an allowed route', () => {
    expect(resolve({ '/admin/**': { robots: false }, '/': { robots: true } }))
      .toEqual({
        '/': enabledValue,
        '/admin/**': 'noindex, nofollow',
        '/_nuxt': 'noindex',
        '/_nuxt/**': 'noindex',
      })
  })

  it('drops the build asset rules when a catch-all rule already sends noindex', () => {
    expect(resolve({ '/**': { robots: 'noindex, nofollow' } })).toEqual({ '/**': 'noindex, nofollow' })
    expect(resolve({ '/**': { robots: false } })).toEqual({ '/**': 'noindex, nofollow' })
  })

  it('keeps the build asset rules when the covering rule has no noindex', () => {
    expect(resolve({ '/**': { robots: 'noai' } }))
      .toEqual({ '/**': 'noai', '/_nuxt': 'noindex', '/_nuxt/**': 'noindex' })
  })

  it('keeps the build asset rules when a user rule covers other paths only', () => {
    expect(resolve({ '/admin/**': { robots: 'noindex, nofollow' } }))
      .toEqual({ '/admin/**': 'noindex, nofollow', '/_nuxt': 'noindex', '/_nuxt/**': 'noindex' })
  })
})

describe('isNoIndexRule', () => {
  it('detects noindex and none directives', () => {
    expect(isNoIndexRule('noindex, nofollow')).toBe(true)
    expect(isNoIndexRule('none')).toBe(true)
    expect(isNoIndexRule('index, nofollow')).toBe(false)
    expect(isNoIndexRule('noai, noimageai')).toBe(false)
  })
})
