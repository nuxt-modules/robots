import { createResolver } from '@nuxt/kit'
import { $fetch, fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../fixtures/basic'),
  build: true,
  server: true,
  nuxtConfig: {
    robots: {
      groups: [
        { userAgent: '*', contentSignal: 'ai-train=no' },
        { userAgent: 'GPTBot', contentSignal: 'ai-train=yes' },
      ],
    },
  },
})

describe('user-agent Content Signal policies', () => {
  it('keeps scoped policies in robots.txt without flattening them into HTTP', async () => {
    const response = await fetch('/')
    const robots = await $fetch<string>('/robots.txt')

    expect(response.headers.get('content-signal')).toBeNull()
    expect(robots).toMatch(/User-agent: \*\nContent-Signal: ai-train=no/)
    expect(robots).toMatch(/User-agent: GPTBot\nContent-Signal: ai-train=yes/)
  })
})
