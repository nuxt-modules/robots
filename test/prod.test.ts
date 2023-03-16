import { describe, expect, it } from 'vitest'
import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../.playground'),
  build: true,
  server: true,
  nuxtConfig: {
    robots: {
      indexable: true,
      siteUrl: 'https://nuxt-simple-robots.com',
      disallow: [
        '/test/',
        '/test3/',
      ],
      sitemap: [
        '/sitemap.xml',
        '/other-sitemap.xml',
      ],
    },
  },
})

describe('build', () => {
  it('basic', async () => {
    expect(await $fetch('/robots.txt')).toMatchInlineSnapshot(`
      "# START nuxt-simple-robots (indexable: true)
      User-agent: *
      Disallow: /test/
      Disallow: /test3/

      Sitemap: https://nuxt-simple-robots.com/sitemap.xml
      Sitemap: https://nuxt-simple-robots.com/other-sitemap.xml
      # END nuxt-simple-robots"
    `)
  }, 60000)
})
