import { describe, expect, it } from 'vitest'
import { parseRobotsTxt, resolveContentSignalHeader } from '../../src/util'

describe('site-wide Content-Signal headers', () => {
  it('preserves unspecified training permission', () => {
    const parsed = parseRobotsTxt('User-agent: *\nContent-Signal: search=yes, ai-input=yes\n')
    expect(resolveContentSignalHeader(parsed.groups)).toBe('search=yes, ai-input=yes')
  })

  it('merges consistent wildcard declarations', () => {
    expect(resolveContentSignalHeader([
      { userAgent: '*', contentSignal: { 'ai-train': 'no', 'search': 'yes' } },
      { userAgent: '*', contentSignal: 'ai-input=yes, search=yes' },
    ])).toBe('ai-train=no, search=yes, ai-input=yes')
  })

  it.each([
    [{ userAgent: 'GPTBot', contentSignal: 'ai-train=no' }],
    [{ userAgent: ['*', 'GPTBot'], contentSignal: 'ai-train=no' }],
    [{ userAgent: '*', contentSignal: 'ai-train=no' }, { userAgent: 'GPTBot', contentSignal: 'ai-train=yes' }],
    [{ userAgent: '*', contentSignal: 'ai-train=yes' }, { userAgent: 'GPTBot', disallow: ['/'] }],
    [{ userAgent: '*', contentSignal: ['ai-train=no', 'ai-train=yes'] }],
    [{ userAgent: '*', contentSignal: 'search=maybe' }],
    [{ userAgent: '*', contentSignal: ['ai-train=no', '/docs/ ai-train=yes'] }],
    [{ userAgent: '*', contentSignal: 'ai-train=no\r\nX-Policy: injected' }],
    [{ userAgent: '*', contentSignal: '' }],
  ].map(groups => [groups]))('does not invent a global policy from %j', (groups) => {
    expect(resolveContentSignalHeader(groups)).toBeUndefined()
  })
})
