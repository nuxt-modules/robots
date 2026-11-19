import { createResolver } from '@nuxt/kit'
import { $fetch, fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../fixtures/comark-content'),
})

describe('comark-content', () => {
  it('serves content queries from the built server', async () => {
    const response = await fetch('/__comark_content/query', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        _tag: 'Query',
        collection: 'content',
        plan: {
          operations: [
            { _tag: 'Path', value: '/foo' },
          ],
        },
      }),
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject([
      { path: '/foo', robots: false },
    ])
  })

  it('maps the robots frontmatter onto the page seo meta', async () => {
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
