import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

await setup({ rootDir: resolve('../fixtures/content-hook-provider') })

describe('generic content hook provider', () => {
  it('applies robots frontmatter through the shared content hook', async () => {
    const html = await $fetch('/')

    expect(String(html)).toContain('<meta name="robots" content="noindex, nofollow">')
  })
})
