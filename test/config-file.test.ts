import { describe, test, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('config file', async () => {
  await setup({
    nuxtConfig: {
      robots: {
        configPath: './robots.configfile.ts'
      }
    }
  })

  test('render', async () => {
    const body = await $fetch('/robots.txt')
    expect(body).toBe('User-agent: Googlebot\nUser-agent: Bingbot\nDisallow: /admin')
  })
})
