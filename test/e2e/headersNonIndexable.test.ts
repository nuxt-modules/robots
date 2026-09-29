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
    site: { indexable: false },
  },
})

describe('x-robots-tag on a non-indexable site', () => {
  it('sends one noindex header on every response', async () => {
    const paths = ['/', '/api/data.json', '/api/dynamic', '/robots.txt', findBuildAsset()]
    const headers = Object.fromEntries(await Promise.all(paths.map(async path => [path, await fetchRobotsHeaders(path)])))
    expect(headers).toEqual(Object.fromEntries(paths.map(path => [path, ['noindex, nofollow']])))
  })
})
