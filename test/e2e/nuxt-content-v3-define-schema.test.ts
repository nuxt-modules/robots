import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../fixtures/content-v3-define-schema'),
  build: true,
})

describe('nuxt/content v3 defineRobotsSchema', () => {
  it('renders robots meta from content frontmatter', async () => {
    const barHtml = await $fetch('/bar')
    expect(String(barHtml).match(/<meta name="robots" content="([^"]+)">/)).toMatchInlineSnapshot(`
      [
        "<meta name="robots" content="test">",
        "test",
      ]
    `)

    const fooHtml = await $fetch('/foo')
    expect(String(fooHtml).match(/<meta name="robots" content="([^"]+)">/)).toMatchInlineSnapshot(`
      [
        "<meta name="robots" content="noindex, nofollow">",
        "noindex, nofollow",
      ]
    `)
  }, 60000)
})
