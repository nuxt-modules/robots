import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'
import { fetchRobotsHeaders, findBuildAsset } from './utils/headers'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'
await setup({
  rootDir: resolve('../fixtures/static-headers'),
  build: true,
  nuxtConfig: {
    routeRules: {
      '/**': { robots: false },
      '/': { robots: true },
    },
    nitro: {
      prerender: {
        routes: ['/'],
      },
    },
  },
})

// A default-deny config with explicit allows. The catch-all noindex header must not
// reach the allowed route, which Nitro serves as a prerendered static file.
describe('a catch-all `robots: false` route rule with an allowed route', () => {
  it('sends the enabled value on the prerendered allowed route', async () => {
    expect(await fetchRobotsHeaders('/')).toEqual(['index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'])
  })
  it('sends one noindex header on build assets', async () => {
    expect(await fetchRobotsHeaders(findBuildAsset())).toEqual(['noindex'])
  })
  it('drops the overlapping catch-all header from denied static files', async () => {
    expect(await fetchRobotsHeaders('/api/data.json')).toEqual([])
  })
  it('labels robots.txt as indexable', async () => {
    const robotsTxt = await $fetch<string>('/robots.txt')
    expect(robotsTxt).toContain('# START nuxt-robots (indexable)')
  })
})
