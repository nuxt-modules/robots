import { resolve } from 'path'
import { readFileSync } from 'fs'
import { describe, test, expect } from 'vitest'
import { setup, useTestContext } from '@nuxt/test-utils'

describe('generate', async () => {
  await setup({})

  test('render', () => {
    const body = readFileSync(resolve(useTestContext().nuxt?.options.nitro.output?.dir || '', 'public/robots.txt'), 'utf8')
    expect(body).toBe('User-agent: *\nDisallow: ')
  })
})
