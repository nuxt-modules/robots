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
      Disallow: /*/account
      Disallow: /sub/*

      Sitemap: https://nuxtseo.com/sitemap.xml
      # END nuxt-robots"
    `)
  })
})
