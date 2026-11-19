import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { mergeContentSignalHeaders } from '../../src/content-signal-headers'

// Cloudflare compiles paths into an ordered map, then unsets before setting each matching rule.
function serveAsset(contents: string, path: string, body: string) {
  const rules = new Map<string, { values: [string, string][], remove: string[] }>()
  let rule: { values: [string, string][], remove: string[] } | undefined
  for (const line of contents.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#'))
      continue
    if (!/^\s/.test(line)) {
      rule = { values: [], remove: [] }
      rules.set(line, rule)
    }
    else if (rule) {
      const removal = line.trim().match(/^!\s*(\S.*)$/)
      if (removal)
        rule.remove.push(removal[1]!)
      const value = line.trim().match(/^([^:]+):(.*)$/)
      if (value)
        rule.values.push([value[1]!, value[2]!.trim()])
    }
  }
  const response = new Response(body)
  for (const [pattern, { values, remove }] of rules) {
    const matcher = new RegExp(`^${pattern.split('*').map(part => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`)
    if (!matcher.test(path))
      continue
    for (const name of remove)
      response.headers.delete(name)
    for (const [name, value] of values)
      response.headers.append(name, value)
  }
  return response
}

describe('overlapping static Content-Signal policies', () => {
  it('serves both explicit permissions without the generated fallback permission', async () => {
    const contents = '/docs/*\n  Content-Signal: ai-train=no\n\n/docs/private/*\n  Content-Signal: search=yes\n'
    // eslint-disable-next-line harlanzw/no-test-file-reads -- Read a static asset fixture, not source code.
    const body = await readFile(new URL('../fixtures/content-signal-headers/public/policy.md', import.meta.url), 'utf8')
    const merged = mergeContentSignalHeaders(contents, '/*', 'ai-input=yes')
    const response = serveAsset(merged, '/docs/private/policy.md', body)
    expect(response.headers.get('content-signal')).toBe('ai-train=no, search=yes')
    expect(await response.text()).toBe(body)
  })

  it('preserves an original removal between explicit settings', () => {
    const contents = '/docs/*\n  Content-Signal: ai-train=no\n\n/docs/private/*\n  ! Content-Signal\n  Content-Signal: search=yes\n'
    const merged = mergeContentSignalHeaders(contents, '/*', 'ai-input=yes')
    expect(serveAsset(merged, '/docs/private/policy.md', '').headers.get('content-signal')).toBe('search=yes')
  })

  it('still supplies the fallback when only one explicit policy exists', () => {
    const contents = '/docs/*\n  Content-Signal: ai-train=no\n'
    const merged = mergeContentSignalHeaders(contents, '/*', 'ai-input=yes')
    expect(serveAsset(merged, '/docs/policy.md', '').headers.get('content-signal')).toBe('ai-train=no')
    expect(serveAsset(merged, '/other/policy.md', '').headers.get('content-signal')).toBe('ai-input=yes')
  })
})

describe('static fallback coverage and authored security headers', () => {
  it('preserves framing protection after an authored narrow removal', () => {
    const contents = '/embed/*\n  ! X-Frame-Options\n\n/*\n  X-Frame-Options: DENY\n'
    const merged = mergeContentSignalHeaders(contents, '/*', 'ai-train=no')
    for (const path of ['/embed/page', '/index.html']) {
      expect(serveAsset(merged, path, '').headers.get('x-frame-options')).toBe('DENY')
      expect(serveAsset(merged, path, '').headers.get('content-signal')).toBe('ai-train=no')
    }
  })

  it('keeps disjoint overrides and supplies the denial on uncovered assets', () => {
    const contents = '/docs/*\n  Content-Signal: search=yes\n\n/media/*\n  Content-Signal: ai-input=yes\n'
    const merged = mergeContentSignalHeaders(contents, '/*', 'ai-train=no')
    expect(serveAsset(merged, '/docs/page', '').headers.get('content-signal')).toBe('search=yes')
    expect(serveAsset(merged, '/media/image.jpg', '').headers.get('content-signal')).toBe('ai-input=yes')
    expect(serveAsset(merged, '/index.html', '').headers.get('content-signal')).toBe('ai-train=no')
  })
})

describe('unsafe static policy combinations', () => {
  it('rejects a later wider policy instead of erasing an earlier denial', () => {
    const contents = '/docs/private/*\n  Content-Signal: ai-train=no\n\n/docs/*\n  Content-Signal: search=yes\n'
    expect(() => mergeContentSignalHeaders(contents, '/*', 'ai-input=yes')).toThrow('Content-Signal fallback cannot preserve')
  })

  it('rejects a fallback after an explicit policy without moving security headers', () => {
    const contents = '/docs/*\n  Content-Signal: ai-train=no\n  ! X-Frame-Options\n\n/*\n  X-Frame-Options: DENY\n'
    expect(() => mergeContentSignalHeaders(contents, '/*', 'ai-input=yes')).toThrow('Content-Signal fallback cannot preserve')
  })

  it('keeps explicit removals and security headers across nested and uncovered assets', () => {
    const contents = '/*\n  X-Frame-Options: DENY\n\n/docs/*\n  Content-Signal: ai-train=no\n\n/docs/private/*\n  ! X-Frame-Options\n  ! Content-Signal\n  Content-Signal: search=yes\n'
    const merged = mergeContentSignalHeaders(contents, '/*', 'ai-input=yes')
    expect(serveAsset(merged, '/docs/page', '').headers.get('content-signal')).toBe('ai-train=no')
    expect(serveAsset(merged, '/docs/private/page', '').headers.get('content-signal')).toBe('search=yes')
    expect(serveAsset(merged, '/docs/private/page', '').headers.get('x-frame-options')).toBeNull()
    expect(serveAsset(merged, '/index.html', '').headers.get('x-frame-options')).toBe('DENY')
    expect(serveAsset(merged, '/index.html', '').headers.get('content-signal')).toBe('ai-input=yes')
  })
})

describe('cloudflare path compilation boundaries', () => {
  it.each([
    '',
    '/docs/*\n  Content-Signal: ai-train=no\n\n',
    '/docs/*\n  ! Content-Signal\n\n',
  ])('rejects nested collisions before replacing active root security headers, catch-all %j', (broad) => {
    const root = `${broad}/docs/private/*\n  X-Frame-Options: DENY\n  Content-Security-Policy: frame-ancestors 'none'\n`
    const nested = '/docs/private/*\n  Cache-Control: public, max-age=60\n'
    expect(serveAsset(root, '/docs/private/page.html', '').headers.get('x-frame-options')).toBe('DENY')
    expect(() => mergeContentSignalHeaders(`${root}\n${nested}`, '/docs/*', 'ai-train=no'))
      .toThrow('Content-Signal fallback cannot preserve')
  })

  it.each([
    '/docs/*\n  Content-Signal: ai-train=no\n\n/docs/*\n  Content-Signal: search=yes\n',
    '/docs*\n  Content-Signal: ai-train=no\n\n/docs/page\n  Content-Signal: search=yes\n',
    '/docs/../media/*\n  Content-Signal: ai-train=no\n\n/media/*\n  Content-Signal: search=yes\n',
  ])('rejects ambiguous paths instead of silently combining the fallback', (contents) => {
    expect(() => mergeContentSignalHeaders(contents, '/*', 'ai-input=yes')).toThrow('Content-Signal fallback cannot preserve')
  })
})
