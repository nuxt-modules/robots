import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'
import { fetchRobotsHeaders, findBuildAsset } from './utils/headers'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'
await setup({
  rootDir: resolve('../fixtures/static-headers'),
  build: true,
})

// An indexable site keeps the exact headers it had before non-indexable sites got full coverage.
describe('x-robots-tag on an indexable site', () => {
  it('sends the enabled value on pages', async () => {
    expect(await fetchRobotsHeaders('/')).toEqual(['index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'])
  })
  it('sends no header on API routes, static files or robots.txt', async () => {
    expect(await fetchRobotsHeaders('/api/data.json')).toEqual([])
    expect(await fetchRobotsHeaders('/api/dynamic')).toEqual([])
    expect(await fetchRobotsHeaders('/robots.txt')).toEqual([])
  })
  it('sends one noindex header on build assets', async () => {
    expect(await fetchRobotsHeaders(findBuildAsset())).toEqual(['noindex'])
  })
})
