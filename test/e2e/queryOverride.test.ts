import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

describe('query override', async () => {
  process.env.NODE_ENV = 'production'
  await setup({
    rootDir: resolve('../fixtures/basic'),
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
  it('robots.txt', async () => {
    // blocked by default
    expect(await $fetch('/robots.txt')).toContain('(indexing disabled)')
    // but can be overridden
    expect(await $fetch('/robots.txt?mockProductionEnv=true')).toContain('(indexable)')
  })
  it('page', async () => {
    const homeResponse = await $fetch('/')
    expect(homeResponse.match(/<meta name="robots" content="([^"]*)">/)?.[1]).toBe('noindex, nofollow')
  })
})
