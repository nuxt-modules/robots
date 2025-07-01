import { createResolver } from '@nuxt/kit'
import { $fetch, createPage, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'

await setup({
  rootDir: resolve('../fixtures/basic'),
  build: true,
})

describe('bot detection', () => {
  it('detects bot user agent correctly', async () => {
    const botResult = await $fetch('/api/bot-detection', {
      headers: {
        'user-agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)',
      },
    })

    expect(botResult.isBot).toBe(true)
    expect(botResult.botName).toBe('googlebot')
    expect(botResult.botCategory).toBe('search-engine')
  })

  it('detects non-bot user agent correctly', async () => {
    const humanResult = await $fetch('/api/bot-detection', {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    })

    expect(humanResult.isBot).toBe(false)
    expect(humanResult.botName).toBeUndefined()
    expect(humanResult.botCategory).toBeUndefined()
  })

  it('detects browser fingerprinting as bot via createPage', async () => {
    const page = await createPage('/bot-detection')

    // Wait for client-side detection to complete
    await page.waitForTimeout(2000)

    const isBotText = await page.textContent('[data-test-id="is-bot"]')
    const botNameText = await page.textContent('[data-test-id="bot-name"]')
    const trustedText = await page.textContent('[data-test-id="trusted"]')

    expect(isBotText).toContain('is bot: true')
    expect(botNameText).toContain('bot name: puppeteer')
    expect(trustedText).toContain('trusted: false')
  })

  it('compares browser fingerprinting vs server-side detection', async () => {
    // Server-side detection (should not detect browser as bot)
    const serverResult = await $fetch('/api/bot-detection')
    expect(serverResult.isBot).toBe(false)

    // Client-side fingerprinting (should detect automation)
    const page = await createPage('/bot-detection')
    await page.waitForTimeout(2000)

    const isBotText = await page.textContent('[data-test-id="is-bot"]')
    expect(isBotText).toContain('is bot: true')
  })
})
