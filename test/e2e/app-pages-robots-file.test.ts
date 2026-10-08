import { createResolver } from '@nuxt/kit'
import { fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)
await setup({ rootDir: resolve('../fixtures/issue338'), dev: false, build: true, nuxtConfig: { dir: { assets: 'unused-assets' } } })
describe('nuxt app pages robots.txt', () => {
  it('merges the file below srcDir', async () => {
    expect(await (await fetch('/robots.txt')).text()).toContain('Disallow: /from-app-pages')
  })
})
