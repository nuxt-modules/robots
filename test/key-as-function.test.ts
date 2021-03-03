import { setupTest, get } from '@nuxt/test-utils'

describe('key as function', () => {
  setupTest({
    server: true,
    fixture: 'fixture/key-as-function'
  })

  test('render', async () => {
    const { body } = await get('/robots.txt')
    expect(body).toBe('User-agent: Googlebot\nUser-agent: Bingbot\nDisallow: /admin')
  })
})
