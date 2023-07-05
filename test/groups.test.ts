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
      groups: [
        {
          userAgent: [
            'Googlebot',
          ],
          disallow: [
            '/test/',
            '/test3/',
          ],
        },
        {
          userAgent: [
            'Bingbot',
            'Yandex',
          ],
          disallow: [
            '/test2/',
          ],
        },
      ],
    },
  },
})

describe('stack', () => {
  it('basic', async () => {
    expect(await $fetch('/robots.txt')).toMatchInlineSnapshot(`
      "# START nuxt-simple-robots (indexable)
      User-agent: Googlebot
      Disallow: /test/
      Disallow: /test3/

      User-agent: Bingbot
      User-agent: Yandex
      Disallow: /test2/

      User-agent: *
      Allow: /secret/exception
      Disallow: /secret
      Disallow: /admin

      Sitemap: http://localhost/sitemap.xml
      # END nuxt-simple-robots"
    `)
  })
})
