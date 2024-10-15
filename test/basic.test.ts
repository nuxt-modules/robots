import { createResolver } from '@nuxt/kit'
import { $fetch, fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'

await setup({
  rootDir: resolve('./fixtures/basic'),
  build: true,
})

describe('basic', () => {
  it('basic', async () => {
    expect((await $fetch('/robots.txt')).split('\n').map(s => s.trim()).join('\n')).toMatchInlineSnapshot(`
      "# START nuxt-robots (indexable)
      User-agent: *
      Disallow:

      # END nuxt-robots"
    `)

    const instance = await fetch('/')
    expect(instance.headers.get('x-robots-tag')).toMatchInlineSnapshot(`"index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"`)
  })
})
