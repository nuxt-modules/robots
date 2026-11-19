import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { readHeadersFile, staticAssetHeaders } from './utils/headers'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../fixtures/content-signal-headers'),
  build: true,
  server: false,
  nuxtConfig: { robots: { contentSignalHeader: true } },
})

function headersFor(path: string) {
  return staticAssetHeaders(readHeadersFile(), path)
}

describe('cloudflare static Content-Signal headers', () => {
  it('serves the wildcard policy without calling the server', () => {
    expect(headersFor('/docs/').get('content-signal')).toBe('ai-train=no, search=yes')
    expect(headersFor('/docs/policy.md').get('content-signal')).toBe('ai-train=no, search=yes')
    expect(headersFor('/elsewhere').get('content-signal')).toBeNull()
  })

  it('keeps the explicit static policy without joining the default', () => {
    expect(headersFor('/docs/api/data.json').get('content-signal')).toBe('search=no')
  })

  it('preserves an explicit header removal', () => {
    expect(headersFor('/docs/removed/page').get('content-signal')).toBeNull()
  })

  it.each(['/docs/policy.md', '/docs/removed/page'])('keeps active framing protection for %s', (path) => {
    expect(headersFor(path).get('x-frame-options')).toBe('DENY')
  })
})
