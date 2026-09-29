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
      '/**': { robots: false },
    },
  },
})

describe('_headers for a catch-all `robots: false` route rule', () => {
  it('writes the disabled value for static files', () => {
    const headers = readHeadersFile()
    expect(staticRobotsHeaders(headers, '/')).toEqual(['noindex, nofollow'])
    expect(staticRobotsHeaders(headers, '/api/data.json')).toEqual(['noindex, nofollow'])
  })
  it('sends one header on build assets, and the stricter directive wins', () => {
    expect(staticRobotsHeaders(readHeadersFile(), findBuildAsset())).toEqual(['noindex, nofollow'])
  })
})
