import { resolve } from 'path'
import { readFileSync } from 'fs'
import { describe, test, expect } from 'vitest'
import { setup, useTestContext } from '@nuxt/test-utils'

describe.skip('generate', async () => {
  await setup({
    fixture: 'fixture/generate'
  })

  test('render', () => {
    const { options } = useTestContext().nuxt
    const body = readFileSync(resolve(options.rootDir, options.generate.dir, 'robots.txt'), 'utf8')
    expect(body).toBe('User-agent: *\nDisallow: ')
  })
})
