const { setupNuxt, loadFixture, get } = require('../utils')

describe('key as function', () => {
  let nuxt

  beforeAll(async () => {
    nuxt = await setupNuxt(loadFixture('key-as-function'))
  }, 60000)

  afterAll(async () => {
    await nuxt.close()
  })

  test('render', async () => {
    const robots = await get('/robots.txt')
    expect(robots).toBe('User-agent: Googlebot\nUser-agent: Bingbot\nDisallow: /admin')
  })
})
