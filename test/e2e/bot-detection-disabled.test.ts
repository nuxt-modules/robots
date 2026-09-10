import { createResolver } from '@nuxt/kit'
import { $fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'

await setup({
  rootDir: resolve('../fixtures/bot-detection-disabled'),
  build: true,
})

describe('bot detection disabled', () => {
  it('builds with the mock auto-imports and reports no bot for a bot user agent', async () => {
    const result = await $fetch('/api/bot-detection', {
      headers: {
        'user-agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)',
      },
    }) as any

    expect(result.isBot).toBe(false)
  }, 15_000)
})
