import { describe, test, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('static', async () => {
  await setup({
    fixture: 'fixture/static'
  })

  test('render', async () => {
    const body = await $fetch('/robots.txt')
    expect(body).toBe('Disallow: /foo\nUser-agent: *\nDisallow: ')
  })
})
