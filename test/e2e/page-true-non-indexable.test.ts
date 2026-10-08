import { createResolver } from '@nuxt/kit'
import { fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)
await setup({ rootDir: resolve('../fixtures/issue338'), dev: false, build: true, nuxtConfig: { site: { env: 'staging' } } })
describe('page boolean on a staging site', () => {
  it('keeps the globally disabled header and meta', async () => {
    const response = await fetch('/')
    expect(response.status).toBe(200)
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect(await response.text()).toContain('<meta name="robots" content="noindex, nofollow">')
  })
})
