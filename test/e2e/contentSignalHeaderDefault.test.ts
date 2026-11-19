import { createResolver } from '@nuxt/kit'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import { expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../fixtures/basic'),
  build: true,
  server: true,
  nuxtConfig: {
    robots: { groups: [{ userAgent: '*', contentSignal: 'ai-train=no' }] },
    routeRules: { '/about': { headers: { 'Content-Signal': 'search=no' } } },
  },
})

it('keeps the configured policy in robots.txt until HTTP publication is enabled', async () => {
  const response = await fetch('/')
  expect(response.headers.get('content-signal')).toBeNull()
  expect(await $fetch<string>('/robots.txt')).toMatch(/Content-Signal: ai-train=no/)
})

it('serves an explicit HTTP header without automatic publication', async () => {
  const response = await fetch('/about')
  expect(response.headers.get('content-signal')).toBe('search=no')
})
