import { setupTest, get } from '@nuxt/test-utils'

describe('with function', () => {
  setupTest({
    server: true,
    fixture: 'fixture/with-object-and-footer'
  })

  test('render', async () => {
    const { body } = await get('/robots.txt')
    expect(body).toBe('User-agent: Googlebot\nDisallow: /\n# Comment')
  })
})
