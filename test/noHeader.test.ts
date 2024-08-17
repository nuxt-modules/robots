import { describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils'
import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'
await setup({
  rootDir: resolve('../.playground'),
  build: true,
  nuxtConfig: {
    robots: {
      debug: true,
      header: false,
    },
  },
})

describe('noHeader', () => {
  it('basic', async () => {
    const { headers, _data } = await $fetch.raw('/')
    expect(headers.get('X-Robots-Tag')).toBe(null)
  })
})
