import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'
import { fetchRobotsHeaders } from './utils/headers'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'
await setup({
  rootDir: resolve('../fixtures/static-headers'),
  build: true,
  // The build is indexable. The server runs in a non-production environment.
  env: {
    NUXT_SITE_ENV: 'staging',
  },
})

describe('x-robots-tag when the site is non-indexable at runtime only', () => {
  it('sends one noindex header on every response the server renders', async () => {
    const paths = ['/', '/api/dynamic', '/robots.txt']
    const headers = Object.fromEntries(await Promise.all(paths.map(async path => [path, await fetchRobotsHeaders(path)])))
    expect(headers).toEqual(Object.fromEntries(paths.map(path => [path, ['noindex, nofollow']])))
  })
})
