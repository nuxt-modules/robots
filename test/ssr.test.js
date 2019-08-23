const { setup, loadConfig, get } = require('@nuxtjs/module-test-utils')

describe('ssr', () => {
  let nuxt

  beforeAll(async () => {
    ({ nuxt } = nuxt = await setup(loadConfig(__dirname, 'ssr')))
  }, 60000)

  afterAll(async () => {
    await nuxt.close()
  })

  test('render', async () => {
    const robots = await get('/robots.txt')
    expect(robots).toBe('User-agent: *\nDisallow: ')
  })
})
