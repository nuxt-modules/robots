import { resolve } from 'path'
import { readFileSync } from 'fs'
import { setupTest, getNuxt } from '@nuxt/test-utils'

describe('generate', () => {
  setupTest({
    build: true,
    generate: true,
    fixture: 'fixture/generate'
  })

  test('render', () => {
    const { options } = getNuxt()
    const body = readFileSync(resolve(options.rootDir, options.generate.dir, 'robots.txt'), 'utf8')
    expect(body).toBe('User-agent: *\nDisallow: ')
  })
})
