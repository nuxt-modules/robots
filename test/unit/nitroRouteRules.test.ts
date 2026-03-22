import { describe, expect, it } from 'vitest'
import { normaliseRobotsRouteRule } from '../../src/runtime/server/nitro'

describe('normaliseRobotsRouteRule with new directives', () => {
  it('should handle object syntax with noai directive', () => {
    const result = normaliseRobotsRouteRule({
      robots: { noai: true },
    } as any)

    expect(result).toEqual({
      allow: false,
      rule: 'noai',
    })
  })

  it('should handle object syntax with noimageai directive', () => {
    const result = normaliseRobotsRouteRule({
      robots: { noimageai: true },
    } as any)

    expect(result).toEqual({
      allow: false,
      rule: 'noimageai',
    })
  })

  it('should handle object syntax with multiple directives', () => {
    const result = normaliseRobotsRouteRule({
      robots: { noindex: true, noai: true },
    } as any)

    expect(result).toEqual({
      allow: false,
      rule: 'noindex, noai',
    })
  })

  it('should handle string syntax for noai', () => {
    const result = normaliseRobotsRouteRule({
      robots: 'noai',
    })

    expect(result).toEqual({
      allow: false,
      rule: 'noai',
    })
  })

  it('should handle custom combined rules with noai', () => {
    const result = normaliseRobotsRouteRule({
      robots: 'noindex, noai',
    })

    expect(result).toEqual({
      allow: false,
      rule: 'noindex, noai',
    })
  })

  it('should handle object syntax with noai rule', () => {
    const result = normaliseRobotsRouteRule({
      robots: {
        indexable: false,
        rule: 'noai',
      },
    })

    expect(result).toEqual({
      allow: false,
      rule: 'noai',
    })
  })

  it('should return undefined for undefined config', () => {
    const result = normaliseRobotsRouteRule(undefined)
    expect(result).toBeUndefined()
  })

  it('should return undefined for null config', () => {
    const result = normaliseRobotsRouteRule(null)
    expect(result).toBeUndefined()
  })

  it('should handle standard directives', () => {
    const result = normaliseRobotsRouteRule({
      robots: 'index, follow',
    })

    expect(result).toEqual({
      allow: true,
      rule: 'index, follow',
    })
  })
})
