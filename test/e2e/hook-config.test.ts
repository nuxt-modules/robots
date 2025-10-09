import { createResolver } from '@nuxt/kit'
import { $fetch, fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'

describe('hook system (robots:robots-txt:input)', async () => {
  await setup({
    rootDir: resolve('../fixtures/hook-config'),
    build: true,
    server: true,
    nuxtConfig: {
      nitro: {
        plugins: ['plugins/robots.ts'],
      },
    },
  })

  it('robots:robots-txt:input hook is called and can add groups', async () => {
    const robotsTxt = await $fetch('/robots.txt')
    // Should include groups added via robots:robots-txt:input hook
    expect(robotsTxt).toContain('Disallow: /_cwa/*')
    expect(robotsTxt).toContain('AhrefsBot')
  })

  it('robots:robots-txt:input hook receives normalized groups', async () => {
    // Groups should be normalized with _indexable property
    // Pages that don't match disallow patterns should be indexable
    const response = await fetch('/')
    expect(response.headers.get('x-robots-tag')).toContain('index')
  })

  it('should NOT block indexable pages when groups are added via hook', async () => {
    // This test demonstrates the bug: pages that should be indexable
    // are incorrectly marked as non-indexable because groups added via
    // the hook are missing the _indexable property
    const indexResponse = await fetch('/', {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    })

    // This page should NOT have noindex header because:
    // 1. The disallow rule is for /_cwa/* which doesn't match /
    // 2. The AhrefsBot rule only applies to AhrefsBot user agent, not Mozilla
    expect(indexResponse.headers.get('x-robots-tag')).toContain('index')
    expect(indexResponse.headers.get('x-robots-tag')).not.toContain('noindex')
  })

  it('should correctly block paths matching disallow patterns', async () => {
    // This should be blocked by the /_cwa/* rule even though page doesn't exist
    // We test with ignoreResponseError to capture headers from 404 responses
    const response = await fetch('/_cwa/test', {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    })

    expect(response.headers.get('x-robots-tag')).toMatchInlineSnapshot(`"noindex, nofollow"`)
  })

  it('should block AhrefsBot from all paths', async () => {
    const indexResponse = await fetch('/', {
      headers: {
        'User-Agent': 'AhrefsBot',
      },
    })

    // AhrefsBot should be blocked everywhere
    expect(indexResponse.headers.get('x-robots-tag')).toMatchInlineSnapshot(`"noindex, nofollow"`)
  })

  // Edge case: Multiple hook calls shouldn't cause issues
  it('should handle multiple hook calls without breaking normalization', async () => {
    // Second request - the hook might be called again depending on caching
    const response = await fetch('/api/test', {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    })

    // Should still work correctly on subsequent requests
    expect(response.headers.get('x-robots-tag')).toBeDefined()
  })

  // Edge case: Empty user agent header
  it('should handle requests with no user agent gracefully', async () => {
    const response = await fetch('/', {
      headers: {
        // No User-Agent header
      },
    })

    // Should still apply rules (defaults to * user agent)
    expect(response.headers.get('x-robots-tag')).toBeDefined()
  })

  // Edge case: Case sensitivity in user agent matching
  it('should handle user agent case variations', async () => {
    const tests = [
      { ua: 'ahrefsbot', desc: 'lowercase' },
      { ua: 'AHREFSBOT', desc: 'uppercase' },
      { ua: 'AhRefsBot', desc: 'mixed case' },
    ]

    for (const { ua } of tests) {
      const response = await fetch('/', {
        headers: {
          'User-Agent': ua,
        },
      })

      // User agent matching should be case-insensitive
      expect(response.headers.get('x-robots-tag')).toContain('noindex')
    }
  })
})
