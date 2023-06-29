import { describe, expect, it } from 'vitest'
import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils'

const { resolve } = createResolver(import.meta.url)

// would normally not be indexable
process.env.NODE_ENV = 'staging'
await setup({
  rootDir: resolve('../.playground'),
  build: true,
  server: true,
  nuxtConfig: {
    site: {
      indexable: true,
      url: 'https://nuxt-simple-robots.com',
    },
    robots: {
      sitemap: [
        '/sitemap.xml',
      ],
    },
  },
})

describe('siteConfig', () => {
  it('basic', async () => {
    const robotsTxt = await $fetch('/robots.txt')
    // the site.url should be appended
    expect(robotsTxt.includes('Sitemap: https://nuxt-simple-robots.com/sitemap.xml')).toBe(true)
    // site.indexable should be honoured
    expect(robotsTxt.includes('(indexable)')).toBe(true)
  })
})
