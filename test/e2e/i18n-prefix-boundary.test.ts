import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'

await setup({
  rootDir: resolve('../fixtures/i18n'),
  build: true,
  server: true,
  nuxtConfig: {
    i18n: {
      strategy: 'prefix_except_default',
    },
    routeRules: {
      '/ding': { robots: false },
    },
  },
})

describe('i18n route prefix boundaries', () => {
  it('does not treat a locale-like prefix as a locale segment', async () => {
    expect((await $fetch<string>('/ending?mockProductionEnv=true')).match(/<meta name="robots" content="([^"]+)">/)?.[1])
      .toBe('index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')
  })
})
