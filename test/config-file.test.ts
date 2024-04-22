import { describe, test, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('config file', async () => {
  await setup({
    fixture: 'fixture/config-file',
  })

  test('render', async () => {
    const body = await $fetch('/robots.txt')
    expect(body).toMatch(/User-agent: Googlebot\nUser-agent: Bingbot\n# Comment here\n\nDisallow: \/admin\nSitemap: https:\/\/127\.0\.0\.1:[0-9]+\/sitemap\.xml/)
  })

  test('render with different host', async () => {
    const body = await $fetch('/robots.txt', { headers: { Host: 'robots.test:1234' } })
    expect(body).toBe('User-agent: Googlebot\nUser-agent: Bingbot\n# Comment here\n\nDisallow: /admin\nSitemap: https://robots.test:1234/sitemap.xml')
  })
})
