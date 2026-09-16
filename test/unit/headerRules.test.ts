import { describe, expect, it } from 'vitest'
import { resolveRobotsHeaderRules } from '../../src/header-rules'
import { isNoIndexRule } from '../../src/util'

const buildAssetRules = {
  '/_nuxt': { robots: 'noindex' },
  '/_nuxt/**': { robots: 'noindex' },
}

function resolve(routeRules: Record<string, any>, indexable = true) {
  return resolveRobotsHeaderRules({
    routeRules: { ...routeRules, ...buildAssetRules },
    indexable,
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

  it('sends no header for an indexable rule', () => {
    expect(resolve({ '/open/**': { robots: true }, '/custom': { robots: 'index, follow' } }))
      .toEqual({ '/_nuxt': 'noindex', '/_nuxt/**': 'noindex' })
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
