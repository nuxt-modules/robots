import { describe, expect, it } from 'vitest'
import { normalizeRobotsContext } from '../../src/runtime/server/util'

describe('normalizeRobotsContext', () => {
  it('should normalize empty input', () => {
    const result = normalizeRobotsContext({})

    expect(result.groups).toEqual([])
    expect(result.sitemaps).toEqual([])
    expect(result.errors).toEqual([])
  })

  it('should normalize groups with _indexable and _rules', () => {
    const result = normalizeRobotsContext({
      groups: [
        {
          userAgent: ['*'],
          disallow: ['/'],
        } as any,
      ],
    })

    expect(result.groups).toHaveLength(1)
    expect(result.groups[0]).toHaveProperty('_indexable', false)
    expect(result.groups[0]).toHaveProperty('_rules')
  })

  it('should convert string sitemap to array', () => {
    const result = normalizeRobotsContext({
      sitemaps: '/sitemap.xml' as any,
    })

    expect(result.sitemaps).toEqual(['/sitemap.xml'])
  })

  it('should keep array sitemaps as array', () => {
    const result = normalizeRobotsContext({
      sitemaps: ['/sitemap.xml', '/sitemap2.xml'],
    })

    expect(result.sitemaps).toEqual(['/sitemap.xml', '/sitemap2.xml'])
  })

  it('should filter out falsy sitemaps', () => {
    const result = normalizeRobotsContext({
      sitemaps: ['', '/sitemap.xml', null, undefined, '/sitemap2.xml'] as any,
    })

    expect(result.sitemaps).toEqual(['/sitemap.xml', '/sitemap2.xml'])
  })

  it('should filter out whitespace-only sitemaps', () => {
    const result = normalizeRobotsContext({
      sitemaps: ['  ', '/sitemap.xml', '\t', '/sitemap2.xml'] as any,
    })

    expect(result.sitemaps).toEqual(['/sitemap.xml', '/sitemap2.xml'])
  })

  it('should deduplicate sitemaps', () => {
    const result = normalizeRobotsContext({
      sitemaps: ['/sitemap.xml', '/sitemap2.xml', '/sitemap.xml', '/sitemap2.xml'],
    })

    expect(result.sitemaps).toEqual(['/sitemap.xml', '/sitemap2.xml'])
  })

  it('should filter out non-string sitemaps', () => {
    const result = normalizeRobotsContext({
      sitemaps: ['/sitemap.xml', 123, { url: '/sitemap' }, '/sitemap2.xml'] as any,
    })

    expect(result.sitemaps).toEqual(['/sitemap.xml', '/sitemap2.xml'])
  })

  it('should convert string errors to array', () => {
    const result = normalizeRobotsContext({
      errors: 'Something went wrong' as any,
    })

    expect(result.errors).toEqual(['Something went wrong'])
  })

  it('should filter out falsy errors', () => {
    const result = normalizeRobotsContext({
      errors: ['', 'Error 1', null, undefined, 'Error 2'] as any,
    })

    expect(result.errors).toEqual(['Error 1', 'Error 2'])
  })

  it('should filter out whitespace-only errors', () => {
    const result = normalizeRobotsContext({
      errors: ['  ', 'Error 1', '\n\t', 'Error 2'] as any,
    })

    expect(result.errors).toEqual(['Error 1', 'Error 2'])
  })

  it('should filter out non-string errors', () => {
    const result = normalizeRobotsContext({
      errors: ['Error 1', 123, { message: 'error' }, 'Error 2'] as any,
    })

    expect(result.errors).toEqual(['Error 1', 'Error 2'])
  })

  it('should handle undefined values gracefully', () => {
    const result = normalizeRobotsContext({
      groups: undefined,
      sitemaps: undefined,
      errors: undefined,
    })

    expect(result.groups).toEqual([])
    expect(result.sitemaps).toEqual([])
    expect(result.errors).toEqual([])
  })

  it('should normalize complete input', () => {
    const result = normalizeRobotsContext({
      groups: [
        {
          userAgent: ['Googlebot'],
          disallow: ['/admin'],
        } as any,
      ],
      sitemaps: ['/sitemap.xml'],
      errors: ['Warning: something'],
    })

    expect(result.groups).toHaveLength(1)
    expect(result.groups[0]?._indexable).toBe(true)
    expect(result.sitemaps).toEqual(['/sitemap.xml'])
    expect(result.errors).toEqual(['Warning: something'])
  })
})
