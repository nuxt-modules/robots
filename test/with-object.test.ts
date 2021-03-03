import { setupTest, get } from '@nuxt/test-utils'

describe('with object', () => {
  setupTest({
    server: true,
    fixture: 'fixture/with-object'
  })

  test('render', async () => {
    const { body } = await get('/robots.txt')
    expect(body).toBe('User-agent: Googlebot\nDisallow: /')
  })
})
