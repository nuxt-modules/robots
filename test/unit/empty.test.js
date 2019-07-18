const { setupNuxt, loadFixture, get } = require('../utils')

describe('empty', () => {
  let nuxt

  beforeAll(async () => {
    nuxt = await setupNuxt(loadFixture('empty'))
  }, 60000)

  afterAll(async () => {
    await nuxt.close()
  })

  test('render', async () => {
    const robots = await get('/robots.txt')
    expect(robots).toBe('')
  })
})
