import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'

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
            '/test3',
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
      "# START nuxt-robots (indexable)
      User-agent: Googlebot
      Disallow: /test/
      Disallow: /test3

      User-agent: Bingbot
      User-agent: Yandex
      Disallow: /test2/

      User-agent: *
      Allow: /secret/exception
      Disallow: /secret
      Disallow: /admin
      Disallow: /*/hidden
      Disallow: /users/*/hidden
      Disallow: /?a=
      Disallow: /visible?*a=

      Sitemap: https://nuxtseo.com/sitemap.xml
      # END nuxt-robots"
    `)
  })
  it('blocks GoogleBot from /test3', async () => {
    const { headers } = await $fetch.raw('/test3', {
      headers: {
        'User-Agent': 'Googlebot',
      },
    })
    expect(headers.get('x-robots-tag')).toMatchInlineSnapshot(`"noindex, nofollow"`)
  })
})
