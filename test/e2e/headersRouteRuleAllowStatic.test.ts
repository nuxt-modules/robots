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
      '/': { robots: true },
    },
  },
})

// Static hosts apply every matching `_headers` rule, so an overlapping noindex rule
// would send noindex to the allowed route. It must drop out of `_headers`.
describe('_headers for a catch-all `robots: false` route rule with an allowed route', () => {
  it('sends only the enabled value on the allowed route', () => {
    expect(staticRobotsHeaders(readHeadersFile(), '/')).toEqual(['index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'])
  })
  it('sends no header on denied static files, robots.txt crawling rules cover them', () => {
    expect(staticRobotsHeaders(readHeadersFile(), '/api/data.json')).toEqual([])
  })
  it('sends one noindex header on build assets', () => {
    expect(staticRobotsHeaders(readHeadersFile(), findBuildAsset())).toEqual(['noindex'])
  })
})
