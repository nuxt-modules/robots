import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'
await setup({
  rootDir: resolve('./fixtures/basic'),
  build: true,
  nuxtConfig: {
    site: {
      env: 'staging', // staging blocks
      url: 'https://example.com',
    },

    robots: {
      debug: true,
    },
  },
})

describe('query override', () => {
  it('robots.txt', async () => {
    // blocked by default
    expect(await $fetch('/robots.txt')).toContain('(indexing disabled)')
    // but can be overridden
    expect(await $fetch('/robots.txt', {
      params: {
        mockProductionEnv: true,
      },
    })).toContain('(indexable)')
  })
  it('page', async () => {
    const homeResponse = await $fetch('/')
    expect(homeResponse.match(/<meta name="robots" content="(.*)">/)?.[1]).toMatchInlineSnapshot(`"noindex, nofollow"`)
  })
})
