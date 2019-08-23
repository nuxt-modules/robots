const { setup, loadConfig, get } = require('@nuxtjs/module-test-utils')

describe('with object', () => {
  let nuxt

  beforeAll(async () => {
    ({ nuxt } = nuxt = await setup(loadConfig(__dirname, 'with-object')))
  }, 60000)

  afterAll(async () => {
    await nuxt.close()
  })

  test('render', async () => {
    const robots = await get('/robots.txt')
    expect(robots).toBe('User-agent: Googlebot\nDisallow: /')
  })
})
