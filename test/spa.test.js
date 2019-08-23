const { setup, loadConfig, get } = require('@nuxtjs/module-test-utils')

describe('spa', () => {
  let nuxt

  beforeAll(async () => {
    ({ nuxt } = await setup(loadConfig(__dirname, 'spa')))
  }, 60000)

  afterAll(async () => {
    await nuxt.close()
  })

  test('render', async () => {
    const robots = await get('/robots.txt')
    expect(robots).toBe('User-agent: *\nDisallow: ')
  })
})
