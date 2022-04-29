import { describe, test, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('with object', async () => {
  await setup({
    fixture: 'fixture/with-object'
  })

  test('render', async () => {
    const body = await $fetch('/robots.txt')
    expect(body).toBe('User-agent: Googlebot\nDisallow: /')
  })
})
