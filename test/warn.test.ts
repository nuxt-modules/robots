import { describe, test, expect, vi } from 'vitest'
import { setup } from '@nuxt/test-utils'
import consola from 'consola'

export function mockLogger (): typeof consola {
  const mock = {}

  consola.mockTypes((type) => {
    mock[type] = mock[type] || vi.fn()
    return mock[type]
  })

  // @ts-ignore
  return mock
}

describe('warn', async () => {
  await setup({
    fixture: 'fixture/warn'
  })

  const logger = mockLogger()

  test('should warn if exists public robots.txt', () => {
    expect(logger.warn).toHaveBeenCalledWith('To use `@nuxtjs/robots` module, please remove public `robots.txt`')
  })
})
