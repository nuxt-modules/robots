import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'

await setup({
  rootDir: resolve('../fixtures/i18n'),
  build: true,
  server: true,
  nuxtConfig: {
    robots: {
      disallow: [
        '/secret',
        '/admin',
        '/route-rules-custom-path',
      ],
    },
  },
})

describe('i18n', () => {
  it('basic', async () => {
    const robotsTxt = await $fetch<string>('/robots.txt')
    // /secret and /admin get simple prefix expansion
    expect(robotsTxt).toContain('Disallow: /secret')
    expect(robotsTxt).toContain('Disallow: /en/secret')
    expect(robotsTxt).toContain('Disallow: /es/secret')
    expect(robotsTxt).toContain('Disallow: /fr/secret')
    expect(robotsTxt).toContain('Disallow: /admin')
    expect(robotsTxt).toContain('Disallow: /en/admin')
    // /route-rules-custom-path gets custom i18n path resolution
    expect(robotsTxt).toContain('Disallow: /en/other')
    expect(robotsTxt).toContain('Disallow: /fr/autre')
    expect(robotsTxt).toContain('Disallow: /es/route-rules-custom-path')
    // should NOT contain the naive prefix expansion
    expect(robotsTxt).not.toContain('Disallow: /en/route-rules-custom-path')
    expect(robotsTxt).not.toContain('Disallow: /fr/route-rules-custom-path')
  })
  it('respects route rules', async () => {
    expect((await $fetch<string>('/en/route-rules/?mockProductionEnv=true')).match(/<meta name="robots" content="([^"]+)">/)?.[1]).toMatchInlineSnapshot(`"noindex, nofollow"`)
  })
})
