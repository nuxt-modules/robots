import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'
import { findBuildAsset, readHeadersFile, staticRobotsHeaders } from './utils/headers'

const { resolve } = createResolver(import.meta.url)
process.env.NUXT_SITE_ENV = 'staging'
await setup({ rootDir: resolve('../fixtures/static-headers'), dev: false, build: true, server: false, nuxtConfig: { nitro: { preset: 'cloudflare-module' } } })
describe('static staging environment', () => {
  it('sends noindex for static pages, JSON, robots and build assets', () => {
    const headers = readHeadersFile()
    for (const path of ['/', '/api/data.json', '/robots.txt', findBuildAsset()])
      expect(staticRobotsHeaders(headers, path)).toEqual(['noindex, nofollow'])
  })
})
