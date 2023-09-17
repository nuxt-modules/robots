import { describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils'
import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../.playground'),
  nuxtConfig: {
    site: {
      indexable: false,
    },
  },
})

describe('nonIndexable', () => {
  it('basic', async () => {
    expect(await $fetch('/robots.txt')).toMatchInlineSnapshot(`
      "# START nuxt-simple-robots (indexing disabled)
      User-agent: *
      Disallow: /

      # END nuxt-simple-robots"
    `)
  })
})
