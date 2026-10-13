import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'
await setup({
  rootDir: resolve('../../playground'),
  build: true,
  nuxtConfig: {
    robots: {
      debug: true,
      header: false,
      groups: [{ userAgent: '*', contentSignal: 'ai-train=no' }],
    },
  },
})

describe('noHeader', () => {
  it('basic', async () => {
    const { headers, _data } = await $fetch.raw('/')
    expect(headers.get('X-Robots-Tag')).toBe(null)
    expect(headers.get('Content-Signal')).toBe(null)
  })
})
