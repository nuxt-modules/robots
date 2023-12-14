import { describe, expect, it } from 'vitest'
import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils'

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
      url: 'https://nuxt-simple-robots.com',
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
    // site.indexable should be honoured
    expect(robotsTxt).toMatchInlineSnapshot(`
      "# START nuxt-simple-robots (indexing disabled)
      User-agent: *
      Disallow: /

      # END nuxt-simple-robots"
    `)

    const siteConfigDebug = await $fetch('/__site-config__/debug.json')
    expect(siteConfigDebug.config._context.indexable).toMatchInlineSnapshot(`"computed-env"`)
  })
})
