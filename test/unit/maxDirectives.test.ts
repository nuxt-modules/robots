import { describe, expect, it } from 'vitest'
import { normaliseRobotsRouteRule } from '../../src/runtime/server/nitro'

describe('max-* directives', () => {
  it('should handle max-image-preview directive', () => {
    const result = normaliseRobotsRouteRule({
      robots: { 'max-image-preview': 'large' },
    } as any)

    expect(result).toEqual({
      allow: true,
      rule: 'max-image-preview:large',
    })
  })

  it('should handle max-snippet directive', () => {
    const result = normaliseRobotsRouteRule({
      robots: { 'max-snippet': 120 },
    } as any)

    expect(result).toEqual({
      allow: true,
      rule: 'max-snippet:120',
    })
  })

  it('should handle max-video-preview directive', () => {
    const result = normaliseRobotsRouteRule({
      robots: { 'max-video-preview': 30 },
    } as any)

    expect(result).toEqual({
      allow: true,
      rule: 'max-video-preview:30',
    })
  })

  it('should handle unlimited snippet with -1', () => {
    const result = normaliseRobotsRouteRule({
      robots: { 'max-snippet': -1 },
    } as any)

    expect(result).toEqual({
      allow: true,
      rule: 'max-snippet:-1',
    })
  })

  it('should handle combination of max directives', () => {
    const result = normaliseRobotsRouteRule({
      robots: {
        'max-image-preview': 'standard',
        'max-snippet': 50,
        'max-video-preview': -1,
      },
    } as any)

    expect(result).toEqual({
      allow: true,
      rule: 'max-image-preview:standard, max-snippet:50, max-video-preview:-1',
    })
  })

  it('should handle combination with other directives', () => {
    const result = normaliseRobotsRouteRule({
      robots: {
        'index': true,
        'follow': true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    } as any)

    expect(result).toEqual({
      allow: true,
      rule: 'index, follow, max-image-preview:large, max-snippet:-1',
    })
  })

  it('should handle combination with noai directive', () => {
    const result = normaliseRobotsRouteRule({
      robots: {
        'noai': true,
        'max-image-preview': 'none',
      },
    } as any)

    expect(result).toEqual({
      allow: false,
      rule: 'noai, max-image-preview:none',
    })
  })
})
