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
  },
})

// Pins the `_headers` of an indexable site. The non-indexable header fix must not change them.
describe('_headers on an indexable site', () => {
  it('only marks build assets as noindex', () => {
    const headers = readHeadersFile()
    expect(headers).toMatchInlineSnapshot(`
      "/_nuxt/builds/meta/*
        cache-control: public, max-age=31536000, immutable
      /_nuxt/builds/*
        cache-control: public, max-age=1, immutable
      /_nuxt
        X-Robots-Tag: noindex
      /_nuxt/*
        cache-control: public, max-age=31536000, immutable
        X-Robots-Tag: noindex"
    `)
    expect(staticRobotsHeaders(headers, '/')).toEqual([])
    expect(staticRobotsHeaders(headers, '/api/data.json')).toEqual([])
    expect(staticRobotsHeaders(headers, findBuildAsset())).toEqual(['noindex'])
  })
})
