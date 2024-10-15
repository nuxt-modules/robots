import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'

await setup({
  rootDir: resolve('./fixtures/i18n'),
  build: true,
  server: true,
  nuxtConfig: {
    robots: {
      disallow: [
        '/secret',
        '/admin',
      ],
    },
  },
})

describe('i18n', () => {
  it('basic', async () => {
    expect(await $fetch('/robots.txt')).toMatchInlineSnapshot(`
      "# START nuxt-robots (indexable)
      User-agent: *
      Disallow: /secret
      Disallow: /en/secret
      Disallow: /es/secret
      Disallow: /fr/secret
      Disallow: /admin
      Disallow: /en/admin
      Disallow: /es/admin
      Disallow: /fr/admin

      # END nuxt-robots"
    `)
  })
})
