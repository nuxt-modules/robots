import { describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils'
import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../.playground'),
  build: true,
  server: true,
  nuxtConfig: {
    robots: {
      indexable: false,
      siteUrl: 'https://nuxt-simple-robots.com',
    },
  },
})

describe('build', () => {
  it('basic', async () => {
    expect(await $fetch('/robots.txt')).toMatchInlineSnapshot(`
      "# START nuxt-simple-robots (indexable: false)
      User-agent: *
      Disallow: /

      # END nuxt-simple-robots"
    `)
  }, 60000)
})
