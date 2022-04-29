import { describe, test, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe.skip('with function', async () => {
  await setup({
    fixture: 'fixture/with-function'
  })

  test('render', async () => {
    const body = await $fetch('/robots.txt')
    expect(body).toBe('User-agent: Googlebot\nDisallow: /')
  })
})
