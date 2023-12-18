import { describe, expect, it } from 'vitest'
import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('./fixtures/content'),
})
describe('nuxt/content default', () => {
  it('basic', async () => {
    const nuxtContentUrls = await $fetch('/__robots__/nuxt-content.json')
    expect(nuxtContentUrls).toMatchInlineSnapshot(`
      [
        "/bar",
        "/foo",
      ]
    `)

    const sitemap = await $fetch('/robots.txt')
    expect(sitemap).toMatchInlineSnapshot(`
      "# START nuxt-simple-robots (indexable)
      User-agent: *
      Disallow: /bar
      Disallow: /foo

      # END nuxt-simple-robots"
    `)
  }, 60000)
})
