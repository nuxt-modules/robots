import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'
import { findBuildAsset, readHeadersFile, staticRobotsHeaders } from './utils/headers'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'
await setup({
  rootDir: resolve('../fixtures/static-headers'),
  build: true,
  server: false,
  nuxtConfig: {
    nitro: { preset: 'cloudflare-module' },
    routeRules: {
      '/**': { robots: 'noindex, nofollow' },
    },
  },
})

describe('_headers for a catch-all robots string route rule', () => {
  it('sends one header on build assets, and the stricter directive wins', () => {
    const headers = readHeadersFile()
    expect(staticRobotsHeaders(headers, findBuildAsset())).toEqual(['noindex, nofollow'])
    expect(staticRobotsHeaders(headers, '/_nuxt')).toEqual(['noindex, nofollow'])
  })
})
