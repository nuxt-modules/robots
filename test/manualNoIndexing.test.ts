import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

// would normally not be indexable
process.env.NODE_ENV = 'production'
await setup({
  rootDir: resolve('../.playground'),
  build: true,
  server: true,
  nuxtConfig: {
    site: {
      debug: true,
      url: 'https://nuxt-robots.com',
    },
    robots: {
      disallow: ['/'],
    },
  },
})

describe('manualNoIndexing', () => {
  it('basic', async () => {
    const robotsTxt = await $fetch('/robots.txt')
    // the site.url should be appended
    expect(robotsTxt).toMatchInlineSnapshot(`
      "# START nuxt-robots (indexing disabled)
      User-agent: *
      Disallow: /

      # END nuxt-robots"
    `)
  })
})
