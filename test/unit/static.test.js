const { setupNuxt, loadFixture, get } = require('../utils')

describe('static', () => {
  let nuxt

  beforeAll(async () => {
    nuxt = await setupNuxt(loadFixture('static'))
  }, 60000)

  afterAll(async () => {
    await nuxt.close()
  })

  test('render', async () => {
    const robots = await get('/robots.txt')
    expect(robots).toBe('Disallow: /foo\nUser-agent: *\nDisallow: ')
  })
})
