const { readFileSync } = require('fs')
const { resolve } = require('path')
const { generateNuxt, loadFixture } = require('../utils')

describe('generate', () => {
  let nuxt

  beforeAll(async () => {
    nuxt = await generateNuxt(loadFixture('generate'))
  }, 60000)

  afterAll(async () => {
    await nuxt.close()
  })

  test('render', () => {
    const robots = readFileSync(resolve(__dirname, '../../dist/robots.txt'), 'utf8')
    expect(robots).toBe('User-agent: *\nDisallow: ')
  })
})
