const { setupNuxt, loadFixture, get } = require('../utils')

describe('with function', () => {
  let nuxt

  beforeAll(async () => {
    nuxt = await setupNuxt(loadFixture('with-function-top-level'))
  }, 60000)

  afterAll(async () => {
    await nuxt.close()
  })

  test('render', async () => {
    const robots = await get('/robots.txt')
    expect(robots).toBe('User-agent: Googlebot\nDisallow: /')
  })
})
