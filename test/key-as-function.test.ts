import { describe, test, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('key as function', async () => {
  await setup({
    fixture: 'fixture/key-as-function'
  })

  test('render', async () => {
    const body = await $fetch('/robots.txt')
    expect(body).toBe('User-agent: Googlebot\nUser-agent: Bingbot\nDisallow: /admin')
  })
})
