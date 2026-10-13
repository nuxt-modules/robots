import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'
import { readHeadersFile } from './utils/headers'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../fixtures/content-signal-headers'),
  build: true,
  server: false,
})

function readPolicy(path: string) {
  const headers = new Headers()
  let matches = false
  for (const line of readHeadersFile().split('\n')) {
    if (!line.trim())
      continue
    if (!/^\s/.test(line)) {
      matches = new RegExp(`^${line.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*')}$`).test(path)
      continue
    }
    if (!matches)
      continue
    if (/^\s*!\s*content-signal\s*$/i.test(line))
      headers.delete('content-signal')
    const value = line.trim().match(/^content-signal:(.*)$/i)
    if (value)
      headers.append('content-signal', value[1]!.trim())
  }
  return headers.get('content-signal')
}

describe('cloudflare static Content-Signal headers', () => {
  it('serves the wildcard policy without calling the server', () => {
    expect(readPolicy('/docs/')).toBe('ai-train=no, search=yes')
    expect(readPolicy('/docs/policy.md')).toBe('ai-train=no, search=yes')
    expect(readPolicy('/elsewhere')).toBeNull()
  })

  it('keeps the explicit static policy without joining the default', () => {
    expect(readPolicy('/docs/api/data.json')).toBe('search=no')
  })

  it('preserves an explicit header removal', () => {
    expect(readPolicy('/docs/removed/page')).toBeNull()
  })
})
