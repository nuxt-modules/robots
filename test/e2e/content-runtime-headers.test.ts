import { createResolver } from '@nuxt/kit'
import { fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)
await setup({ rootDir: resolve('../fixtures/content-v3'), dev: false, build: true })
describe('content runtime robots rule', () => {
  it('sets the same frontmatter rule on the header and meta', async () => {
    const response = await fetch('/header')
    expect(response.status).toBe(200)
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect(await response.text()).toContain('<meta name="robots" content="noindex, nofollow">')
  })
})
