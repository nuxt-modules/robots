const { setupNuxt, loadFixture, get } = require('../utils')

describe('with object', () => {
  let nuxt

  beforeAll(async () => {
    nuxt = await setupNuxt(loadFixture('with-object'))
  }, 60000)

  afterAll(async () => {
    await nuxt.close()
  })

  test('render', async () => {
    const robots = await get('/robots.txt')
    expect(robots).toBe('User-agent: Googlebot\nDisallow: /')
  })
})
