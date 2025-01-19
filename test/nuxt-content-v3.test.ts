import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('./fixtures/content-v3'),
})
describe('nuxt/content default', () => {
  it('basic', async () => {
    const barHtml = await $fetch('/bar')
    // extract robots tag
    expect(barHtml.match(/<meta name="robots" content="([^"]+)">/)).toMatchInlineSnapshot(`
      [
        "<meta name="robots" content="test">",
        "test",
      ]
    `)

    const fooHtml = await $fetch('/foo')
    expect(fooHtml.match(/<meta name="robots" content="([^"]+)">/)).toMatchInlineSnapshot(`
      [
        "<meta name="robots" content="noindex, nofollow">",
        "noindex, nofollow",
      ]
    `)
  }, 60000)
})
