import { describe, expect, it } from 'vitest'
import { generateRobotsTxt, getBotDetection, normaliseRobotsRouteRule, normalizeGroup } from '../../src/util'

describe('issue 338 input contracts', () => {
  it('prints a string group comment once', () => {
    expect(generateRobotsTxt({ groups: [normalizeGroup({ comment: 'Google only', userAgent: ['Googlebot'], disallow: ['/private'] })], sitemaps: [] })).toContain('# Google only\n')
  })
  it.each(['noai', 'noimageai', 'index, noai'])('keeps %s indexable', (rule) => {
    expect(normaliseRobotsRouteRule({ robots: rule })?.allow).toBe(true)
  })
  it('ignores a null route rule value', () => {
    expect(normaliseRobotsRouteRule({ robots: null } as any)).toBeUndefined()
  })
  it.each([{ 'User-Agent': 'Googlebot' }, new Headers({ 'User-Agent': 'Googlebot' })])('reads case insensitive user agents', (headers) => {
    expect(getBotDetection(headers as any).isBot).toBe(true)
  })
})
