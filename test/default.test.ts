import { describe, expect, it } from 'vitest'
import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'

await setup({
  rootDir: resolve('../.playground'),
  build: true,
  server: true,
})

describe('default', () => {
  it('basic', async () => {
    expect(await $fetch('/robots.txt')).toMatchInlineSnapshot(`
      "# START nuxt-robots (indexable)
      User-agent: *
      Allow: /secret/exception
      Disallow: /secret
      Disallow: /admin
      Disallow: /*/hidden
      Disallow: /users/*/hidden
      Disallow: /?a=
      Disallow: /visible?*a=
      Disallow: /*/account
      Disallow: /sub/*

      Sitemap: https://nuxtseo.com/sitemap.xml
      # END nuxt-robots"
    `)

    // blocks query from robots.txt
    expect((await $fetch.raw('/?a=test')).headers.get('x-robots-tag')).toMatchInlineSnapshot(`"noindex, nofollow"`)
    // blocks wildcard path
    expect((await $fetch.raw('/users/test/hidden')).headers.get('x-robots-tag')).toMatchInlineSnapshot(`"noindex, nofollow"`)
    // wildcard query
    expect((await $fetch.raw('/visible?b=foo&a=bar')).headers.get('x-robots-tag')).toMatchInlineSnapshot(`"noindex, nofollow"`)
  })
})
