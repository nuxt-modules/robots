const { setupNuxt, loadFixture, get } = require('../utils')

describe('ssr', () => {
  let nuxt

  beforeAll(async () => {
    nuxt = await setupNuxt(loadFixture('ssr'))
  }, 60000)

  afterAll(async () => {
    await nuxt.close()
  })

  test('render', async () => {
    const robots = await get('/robots.txt')
    expect(robots).toBe('User-agent: *\nDisallow: ')
  })
})
