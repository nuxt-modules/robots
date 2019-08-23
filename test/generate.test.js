const { readFileSync } = require('fs')
const { resolve } = require('path')
const { generate, loadConfig } = require('@nuxtjs/module-test-utils')

describe('generate', () => {
  let nuxt

  beforeAll(async () => {
    ({ nuxt } = await generate(loadConfig(__dirname, 'generate')))
  }, 60000)

  afterAll(async () => {
    await nuxt.close()
  })

  test('render', () => {
    const robots = readFileSync(resolve(nuxt.options.rootDir, 'dist/robots.txt'), 'utf8')
    expect(robots).toBe('User-agent: *\nDisallow: ')
  })
})
