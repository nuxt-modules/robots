import { createResolver } from '@nuxt/kit'
import { createPage, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'

await setup({
  rootDir: resolve('../fixtures/spa'),
  build: true,
})

describe('bot detection in SPA mode', () => {
  it('detects bot via navigator.userAgent fallback in SPA', async () => {
    const page = await createPage('/bot-detection')

    // No need to wait - userAgent detection is synchronous on init
    const isBotText = await page.textContent('[data-test-id="is-bot"]')
    const botNameText = await page.textContent('[data-test-id="bot-name"]')

    // HeadlessChrome user-agent detected via navigator.userAgent fallback
    expect(isBotText).toContain('is bot: true')
    expect(botNameText).toContain('puppeteer')
  }, 15_000)
})
