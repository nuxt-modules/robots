import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { mergeContentSignalHeaders } from '../../src/content-signal-headers'

// Cloudflare compiles paths into an ordered map, then unsets before setting each matching rule.
function serveAsset(contents: string, path: string, body: string) {
  const rules = new Map<string, { values: string[], remove: boolean }>()
  let rule: { values: string[], remove: boolean } | undefined
  for (const line of contents.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#'))
      continue
    if (!/^\s/.test(line)) {
      rule = { values: [], remove: false }
      rules.set(line, rule)
    }
    else if (rule) {
      if (/^\s*!\s*content-signal\s*$/i.test(line))
        rule.remove = true
      const value = line.trim().match(/^content-signal:(.*)$/i)
      if (value)
        rule.values.push(value[1]!.trim())
    }
  }
  const response = new Response(body)
  for (const [pattern, { values, remove }] of rules) {
    const matcher = new RegExp(`^${pattern.split('*').map(part => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`)
    if (!matcher.test(path))
      continue
    if (remove)
      response.headers.delete('content-signal')
    for (const value of values)
      response.headers.append('content-signal', value)
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
