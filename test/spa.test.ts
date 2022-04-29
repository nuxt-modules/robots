import { describe, test, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('spa', async () => {
  await setup({
    fixture: 'fixture/spa'
  })

  test('render', async () => {
    const body = await $fetch('/robots.txt')
    expect(body).toBe('User-agent: *\nDisallow: ')
  })
})
