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

    const robots = await $fetch('/robots.txt')
    expect(robots).toMatchInlineSnapshot(`
      "# START nuxt-robots (indexable)
      User-agent: *
      Disallow: /bar
      Disallow: /foo

      # END nuxt-robots"
    `)

    const fooHtml = await $fetch('/foo')
    expect(fooHtml.includes('<meta name="robots" content="noindex, nofollow">')).toBe(true)
  }, 60000)
})
