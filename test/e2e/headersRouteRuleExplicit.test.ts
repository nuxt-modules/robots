import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'
import { fetchRobotsHeaders } from './utils/headers'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'
await setup({
  rootDir: resolve('../fixtures/static-headers'),
  build: true,
  nuxtConfig: {
    routeRules: {
      '/': { headers: { 'x-robots-tag': 'noindex, nofollow' } },
    },
  },
})

// The site is indexable. A route rule that sets the header itself must keep it.
describe('a route rule that sets the `X-Robots-Tag` header', () => {
  it('sends the configured header', async () => {
    expect(await fetchRobotsHeaders('/')).toEqual(['noindex, nofollow'])
  })
  it('renders a robots meta tag with the same value', async () => {
    const html = await $fetch<string>('/')
    expect(html).toMatch(/<meta name="robots" content="noindex, nofollow"/)
  })
})
