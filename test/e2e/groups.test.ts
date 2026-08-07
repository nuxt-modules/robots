import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'

describe('stack', async () => {
  await setup({
    rootDir: resolve('../../playground'),
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
  it('blocks the real GoogleBot product string from /test3', async () => {
    // Crawlers send a product string, never the bare token above — the group has to match a user
    // agent that CONTAINS `Googlebot`.
    const { headers } = await $fetch.raw('/test3', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
    })
    expect(headers.get('x-robots-tag')).toMatchInlineSnapshot(`"noindex, nofollow"`)
  })
  it('does not apply the GoogleBot group to a browser', async () => {
    const { headers } = await $fetch.raw('/test3', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
      },
    })
    expect(headers.get('x-robots-tag')).not.toContain('noindex')
  })
})
