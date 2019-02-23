jest.setTimeout(60000)

const { readFileSync } = require('fs')
const { resolve } = require('path')
const { Nuxt, Builder, Generator } = require('nuxt-edge')
const request = require('request-promise-native')
const getPort = require('get-port')

const config = require('./fixture/nuxt.config')
config.dev = false

let nuxt, port

const url = path => `http://localhost:${port}${path}`
const get = path => request(url(path))

const setupNuxt = async (config) => {
  const nuxt = new Nuxt(config)
  await new Builder(nuxt).build()
  port = await getPort()
  await nuxt.listen(port)

  return nuxt
}

describe('module', () => {
  afterEach(async () => {
    if (nuxt) {
      await nuxt.close()
    }
  })

  test('ssr', async () => {
    nuxt = await setupNuxt(config)

    const robots = await get('/robots.txt')
    expect(robots).toBe('User-agent: *\nDisallow: ')
  })

  test('spa', async () => {
    nuxt = await setupNuxt({
      ...config,
      mode: 'spa'
    })

    const robots = await get('/robots.txt')
    expect(robots).toBe('User-agent: *\nDisallow: ')
  })

  test('generate', async () => {
    nuxt = new Nuxt(config)
    const builder = new Builder(nuxt)
    const generator = new Generator(nuxt, builder)
    await generator.generate()

    const robots = readFileSync(resolve(__dirname, '../dist/robots.txt'), 'utf8')
    expect(robots).toBe('User-agent: *\nDisallow: ')
  })

  test('with object', async () => {
    nuxt = await setupNuxt({
      ...config,
      robots: {
        UserAgent: 'Googlebot',
        Disallow: '/'
      }
    })

    const robots = await get('/robots.txt')
    expect(robots).toBe('User-agent: Googlebot\nDisallow: /')
  })

  test('with array', async () => {
    nuxt = await setupNuxt({
      ...config,
      robots: [
        {
          UserAgent: ['Googlebot', 'Bingbot'],
          Disallow: '/admin'
        }
      ]
    })

    const robots = await get('/robots.txt')
    expect(robots).toBe('User-agent: Googlebot\nUser-agent: Bingbot\nDisallow: /admin')
  })

  test('empty', async () => {
    nuxt = await setupNuxt({
      ...config,
      modules: [
        [require('../'), []]
      ]
    })

    const robots = await get('/robots.txt')
    expect(robots).toBe('')
  })
})
