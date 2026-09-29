import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'
import { fetchRobotsHeaders, findBuildAsset } from './utils/headers'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'
await setup({
  rootDir: resolve('../fixtures/static-headers'),
  build: true,
  nuxtConfig: {
    routeRules: {
      '/**': { robots: 'noindex, nofollow' },
    },
  },
})

describe('a catch-all robots string route rule', () => {
  it('sends one header on build assets, and the stricter directive wins', async () => {
    expect(await fetchRobotsHeaders(findBuildAsset())).toEqual(['noindex, nofollow'])
  })
})
