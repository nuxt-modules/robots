import { createResolver } from '@nuxt/kit'
import { fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../fixtures/basic'),
  build: true,
  server: true,
  nuxtConfig: {
    robots: { groups: [{ userAgent: '*', contentSignal: 'ai-train=no, search=yes, ai-input=yes' }] },
    routeRules: { '/about': { headers: { 'CONTENT-SIGNAL': 'search=no' } } },
  },
})

describe('content-Signal response headers', () => {
  it('publishes the wildcard robots policy', async () => {
    const response = await fetch('/')
    expect(response.headers.get('content-signal')).toBe('ai-train=no, search=yes, ai-input=yes')
  })

  it('preserves an explicit route policy in any casing', async () => {
    const response = await fetch('/about')
    expect(response.headers.get('content-signal')).toBe('search=no')
  })
})
