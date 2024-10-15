import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../.playground'),
  build: true,
  server: true,
  nuxtConfig: {
    robots: {
      credits: false,
    },
  },
})

describe('noCredits', () => {
  it('basic', async () => {
    const robotsTxt = await $fetch('/robots.txt')
    // should not have any comments
    expect(robotsTxt).not.includes('#')
  })
})
