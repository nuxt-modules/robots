import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('./fixtures/basic'),
  nuxtConfig: {
    site: {
      env: 'staging',
      url: 'https://nuxt-robots.com',
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
    // indexing disabled due to non-production env
    expect(robotsTxt.includes('(indexing disabled)')).toBe(true)
  })
})
