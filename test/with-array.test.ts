import { describe, test, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe.skip('with array', async () => {
  await setup({
    fixture: 'fixture/with-array'
  })

  test('render', async () => {
    const body = await $fetch('/robots.txt')
    expect(body).toBe('User-agent: Googlebot\nUser-agent: Bingbot\nDisallow: /admin')
  })
})
