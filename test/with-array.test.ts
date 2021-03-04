import { setupTest, get } from '@nuxt/test-utils'

describe('with array', () => {
  setupTest({
    server: true,
    fixture: 'fixture/with-array'
  })

  test('render', async () => {
    const { body } = await get('/robots.txt')
    expect(body).toBe('User-agent: Googlebot\nUser-agent: Bingbot\nDisallow: /admin')
  })
})
