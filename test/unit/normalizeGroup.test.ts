import { describe, expect, it } from 'vitest'
import { normalizeGroup } from '../../src/util'

describe('normalizeGroup', () => {
  it('should set _indexable to false when disallow includes "/"', () => {
    const group = normalizeGroup({
      userAgent: ['*'],
      disallow: ['/'],
    })

    // BUG: This test currently FAILS
    // The bug is at src/util.ts:275 which uses .includes() instead of .some()
    // .includes() with a callback always returns false, so _indexable is always true
    expect(group._indexable).toBe(false)
  })

  it('should set _indexable to true when disallow does not include "/"', () => {
    const group = normalizeGroup({
      userAgent: ['*'],
      disallow: ['/_cwa/*', '/admin'],
    })

    expect(group._indexable).toBe(true)
  })

  it('should set _indexable to true when disallow is empty', () => {
    const group = normalizeGroup({
      userAgent: ['*'],
      disallow: [],
    })

    expect(group._indexable).toBe(true)
  })

  it('should set _indexable to false when disallow has "/" among other patterns', () => {
    const group = normalizeGroup({
      userAgent: ['AhrefsBot'],
      disallow: ['/', '/other'],
    })

    // BUG: This test currently FAILS due to the .includes() bug
    expect(group._indexable).toBe(false)
  })

  it('should create _rules array from disallow and allow', () => {
    const group = normalizeGroup({
      userAgent: ['*'],
      disallow: ['/admin', '/secret'],
      allow: ['/secret/allowed'],
    })

    expect(group._rules).toEqual([
      { pattern: '/admin', allow: false },
      { pattern: '/secret', allow: false },
      { pattern: '/secret/allowed', allow: true },
    ])
  })

  it('should normalize userAgent to array', () => {
    const group = normalizeGroup({
      userAgent: 'Googlebot',
      disallow: ['/admin'],
    })

    expect(group.userAgent).toEqual(['Googlebot'])
  })

  it('should default userAgent to ["*"] when not provided', () => {
    const group = normalizeGroup({
      disallow: ['/admin'],
    })

    expect(group.userAgent).toEqual(['*'])
  })

  it('should filter out empty allow rules', () => {
    const group = normalizeGroup({
      userAgent: ['*'],
      disallow: ['/admin'],
      allow: ['', '/allowed', null, undefined],
    })

    expect(group.allow).toEqual(['/allowed'])
    expect(group._rules).toContainEqual({ pattern: '/allowed', allow: true })
  })

  // Edge case: disallow with "/" in different positions
  it('should detect "/" at any position in disallow array', () => {
    const group1 = normalizeGroup({ disallow: ['/', '/admin'] })
    const group2 = normalizeGroup({ disallow: ['/admin', '/'] })
    const group3 = normalizeGroup({ disallow: ['/admin', '/', '/secret'] })

    expect(group1._indexable).toBe(false)
    expect(group2._indexable).toBe(false)
    expect(group3._indexable).toBe(false)
  })

  // Edge case: similar patterns to "/" that should NOT trigger _indexable: false
  it('should only detect exact "/" match, not similar patterns', () => {
    const group = normalizeGroup({
      disallow: ['/api', '/*', '//', '/path/', '/ ', ' /'],
    })

    expect(group._indexable).toBe(true)
  })

  // Edge case: double normalization (should be idempotent)
  it('should handle double normalization without breaking', () => {
    const input = { disallow: ['/'] }
    const once = normalizeGroup(input)
    const twice = normalizeGroup(once as any)

    expect(twice._indexable).toBe(false)
    expect(twice.userAgent).toEqual(['*'])
  })

  // Edge case: empty disallow values mixed in
  it('should filter out empty disallow rules from _rules but keep them for _indexable check', () => {
    const group = normalizeGroup({
      disallow: ['', '/admin', null, undefined, '/'],
    })

    // asArray preserves null/undefined in arrays (doesn't filter them)
    expect(group.disallow).toEqual(['', '/admin', null, undefined, '/'])
    expect(group._indexable).toBe(false) // Should still detect '/'
    expect(group._rules).toEqual([
      { pattern: '/admin', allow: false },
      { pattern: '/', allow: false },
    ]) // But .filter(Boolean) removes falsy values from _rules
  })

  // Edge case: non-string disallow values
  it('should handle non-string disallow values gracefully', () => {
    const group = normalizeGroup({
      disallow: ['/admin', 123 as any, false as any, '/'],
    })

    expect(group._indexable).toBe(false)
  })

  // Edge case: undefined/null group properties
  it('should handle missing optional properties', () => {
    const group = normalizeGroup({})

    expect(group.userAgent).toEqual(['*'])
    expect(group.disallow).toEqual([])
    expect(group.allow).toEqual([])
    expect(group._indexable).toBe(true)
    expect(group._rules).toEqual([])
  })

  // Edge case: contentUsage normalization
  it('should normalize and filter contentUsage array', () => {
    const group1 = normalizeGroup({
      contentUsage: 'noai',
    })
    const group2 = normalizeGroup({
      contentUsage: ['noai', 'noimageai', '', null, undefined],
    })

    expect(group1.contentUsage).toEqual(['noai'])
    expect(group2.contentUsage).toEqual(['noai', 'noimageai'])
  })

  // Edge case: Yandex-specific properties
  it('should preserve additional properties like cleanParam', () => {
    const group = normalizeGroup({
      disallow: ['/'],
      cleanParam: ['param1', 'param2'],
    } as any)

    expect(group._indexable).toBe(false)
    expect((group as any).cleanParam).toEqual(['param1', 'param2'])
  })

  // Edge case: _skipI18n property preservation
  it('should preserve _skipI18n internal property', () => {
    const group = normalizeGroup({
      disallow: ['/admin'],
      _skipI18n: true,
    })

    expect(group._skipI18n).toBe(true)
  })
})
