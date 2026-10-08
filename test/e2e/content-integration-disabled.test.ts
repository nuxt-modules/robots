import { createResolver } from '@nuxt/kit'
import { fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)
await setup({ rootDir: resolve('../fixtures/content-v3'), dev: false, build: true, nuxtConfig: { robots: { disableNuxtContentIntegration: true } } })
describe('disabled Content integration', () => {
  it('keeps the default meta instead of mapping frontmatter', async () => {
    const response = await fetch('/foo')
    const html = await response.text()
    expect(html).not.toContain('<meta name="robots" content="noindex, nofollow">')
    expect(response.headers.get('x-robots-tag')).toContain('index, follow')
  })
})
