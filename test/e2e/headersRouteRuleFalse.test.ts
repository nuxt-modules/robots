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
    },
  },
})

describe('a catch-all `robots: false` route rule', () => {
  it('sends the disabled value on every response', async () => {
    const paths = ['/', '/api/data.json', '/api/dynamic', findBuildAsset()]
    const headers = Object.fromEntries(await Promise.all(paths.map(async path => [path, await fetchRobotsHeaders(path)])))
    expect(headers).toEqual(Object.fromEntries(paths.map(path => [path, ['noindex, nofollow']])))
  })
  it('labels robots.txt as indexing disabled', async () => {
    expect(await $fetch('/robots.txt')).toContain('# START nuxt-robots (indexing disabled)')
  })
})
