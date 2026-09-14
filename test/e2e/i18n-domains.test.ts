import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../fixtures/i18n'),
  build: true,
  server: true,
  nuxtConfig: {
    i18n: {
      multiDomainLocales: true,
      strategy: 'prefix_except_default',
      locales: [
        { code: 'en', domains: ['en.example', 'de.example'], defaultForDomains: ['en.example'] },
        { code: 'de', domains: ['de.example'], defaultForDomains: ['de.example'] },
        { code: 'fr' },
      ],
      pages: {
        'route-rules-custom-path': { en: '/private', de: '/privat', fr: '/prive' },
      },
    },
    robots: {
      allow: ['/route-rules-custom-path'],
      disallow: ['/secret', '/route-rules-custom-path'],
    },
  },
})

describe('multi-domain rules', () => {
  it('serves all valid translated rules on each host', async () => {
    for (const host of ['en.example', 'de.example']) {
      const rules = (await $fetch<string>('/robots.txt', { headers: { host } })).split('\n')
      for (const path of ['/private', '/en/private', '/privat', '/fr/prive']) {
        expect(rules).toContain(`Allow: ${path}`)
        expect(rules).toContain(`Disallow: ${path}`)
      }
      expect(rules).toContain('Disallow: /en/secret')
      expect(rules).not.toContain('Disallow: /de/secret')
      expect(rules).not.toContain('Allow: /de/privat')
    }
  })
})
