import { describe, expect, it } from 'vitest'
import { extractRobotsMetaFromHtml } from '../../src/runtime/server/util/extractRobotsMetaFromHtml'

describe('extractRobotsMetaFromHtml', () => {
  it('returns null when no robots meta tag exists', () => {
    const html = '<html><head><meta name="description" content="test"></head><body></body></html>'
    expect(extractRobotsMetaFromHtml(html)).toBeNull()
  })

  it('extracts content when content appears after name', () => {
    const html = '<meta name="robots" content="noindex, nofollow">'
    const result = extractRobotsMetaFromHtml(html)
    expect(result).toEqual({ content: 'noindex, nofollow', productionContent: null, hint: null })
  })

  it('extracts content when content appears before name', () => {
    const html = '<meta content="index, follow" name="robots">'
    const result = extractRobotsMetaFromHtml(html)
    expect(result).toEqual({ content: 'index, follow', productionContent: null, hint: null })
  })

  it('does not match data-production-content as content', () => {
    const html = '<meta name="robots" data-production-content="noindex" content="index, follow">'
    const result = extractRobotsMetaFromHtml(html)
    expect(result).toEqual({ content: 'index, follow', productionContent: 'noindex', hint: null })
  })

  it('extracts all attributes together', () => {
    const html = '<meta name="robots" content="index" data-production-content="noindex" data-hint="config,5">'
    const result = extractRobotsMetaFromHtml(html)
    expect(result).toEqual({ content: 'index', productionContent: 'noindex', hint: 'config,5' })
  })

  it('returns null for missing meta tag in full HTML', () => {
    const html = '<html><head><title>Test</title></head><body><p>No meta here</p></body></html>'
    expect(extractRobotsMetaFromHtml(html)).toBeNull()
  })

  it('handles missing content attribute', () => {
    const html = '<meta name="robots">'
    const result = extractRobotsMetaFromHtml(html)
    expect(result).toEqual({ content: null, productionContent: null, hint: null })
  })
})
