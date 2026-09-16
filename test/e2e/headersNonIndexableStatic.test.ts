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
    site: { indexable: false },
    nitro: { preset: 'cloudflare-module' },
  },
})

describe('_headers on a non-indexable site', () => {
  it('sends one noindex header on every static file', () => {
    const headers = readHeadersFile()
    const paths = ['/', '/api/data.json', '/robots.txt', findBuildAsset()]
    expect(Object.fromEntries(paths.map(path => [path, staticRobotsHeaders(headers, path)])))
      .toEqual(Object.fromEntries(paths.map(path => [path, ['noindex, nofollow']])))
  })
})
