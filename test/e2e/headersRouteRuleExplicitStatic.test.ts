import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'
import { readHeadersFile, staticRobotsHeaders } from './utils/headers'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'
await setup({
  rootDir: resolve('../fixtures/static-headers'),
  build: true,
  server: false,
  nuxtConfig: {
    nitro: { preset: 'cloudflare-module' },
    routeRules: {
      '/': { headers: { 'x-robots-tag': 'noindex, nofollow' } },
    },
  },
})

describe('_headers for a route rule that sets the `X-Robots-Tag` header', () => {
  it('sends the configured header once', () => {
    expect(staticRobotsHeaders(readHeadersFile(), '/')).toEqual(['noindex, nofollow'])
  })
})
