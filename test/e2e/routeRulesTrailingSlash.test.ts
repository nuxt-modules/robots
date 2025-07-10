import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../fixtures/basic'),
  nuxtConfig: {
    site: {
      trailingSlash: true,
    },
    routeRules: {
      '/hidden-route-rules': {
        robots: false,
      } as any,
      '/hidden-route-rules/': {
        robots: false,
      } as any,
    },
  },
})

describe('route rule trailing slash', () => {
  it('basic', async () => {
    const hidden = await $fetch('/hidden-route-rules/')
    expect(String(hidden).match(/<meta name="robots" content="([^"]*)">/)?.[1]).toBe('noindex, nofollow')
  })
})
