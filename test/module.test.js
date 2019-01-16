const { readFileSync } = require('fs')
const { Nuxt, Builder, Generator } = require('nuxt-edge')
const path = require('path')
const request = require('request-promise-native')

const config = require('../example/nuxt.config')

const url = path => `http://localhost:3000${path}`
const get = path => request(url(path))

describe('ssr', () => {
  let nuxt

  beforeAll(async () => {
    nuxt = new Nuxt(config)
    await new Builder(nuxt).build()
    await nuxt.listen(3000)
  }, 60000)

  afterAll(async () => {
    await nuxt.close()
  })

  test('robots.txt', async () => {
    const robots = await get('/robots.txt')
    expect(robots).toContain('User-agent: *\nDisallow:')
  })
})

describe('generate', () => {
  let nuxt

  beforeAll(async () => {
    nuxt = new Nuxt(config)
    const builder = new Builder(nuxt)
    const generator = new Generator(nuxt, builder)
    await generator.generate()
  }, 60000)

  afterAll(async () => {
    await nuxt.close()
  })

  test('robots.txt', async () => {
    const robots = readFileSync(path.resolve(__dirname, '../dist/robots.txt'), 'utf8')
    expect(robots).toContain('User-agent: *\nDisallow:')
  })
})
