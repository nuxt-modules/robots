import { describe, expect, it } from 'vitest'
import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'

await setup({
  rootDir: resolve('./fixtures/i18n'),
  build: true,
  server: true,
  nuxtConfig: {
    robots: {
      credits: false,
    },
  },
})

describe('i18n', () => {
  it('basic', async () => {
    expect(await $fetch('/robots.txt')).toMatchInlineSnapshot(`
      "User-agent: *
      Disallow: 
      "
    `)
  })
})
