import { describe, expect, it } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils'
import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'
await setup({
  rootDir: resolve('./fixtures/basic'),
  build: true,
  nuxtConfig: {
    site: {
      url: 'https://example.com',
      trailingSlash: true,
      indexable: false,
    },

    robots: {
      debug: true,
    },
  },
})

describe('nonIndexable', () => {
  it('basic', async () => {
    expect(await $fetch('/robots.txt')).toMatchInlineSnapshot(`
      "# START nuxt-robots (indexing disabled)
      User-agent: *
      Disallow: /

      # END nuxt-robots"
    `)
  })
})
