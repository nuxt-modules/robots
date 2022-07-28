import { describe, test, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('empty', async () => {
  await setup({
    nuxtConfig: {
      robots: {
        rules: {
          UserAgent: false,
          Disallow: false
        }
      }
    }
  })

  test('render', async () => {
    const body = await $fetch('/robots.txt')
    expect(body).toBe('')
  })
})
