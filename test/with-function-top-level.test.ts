import { setupTest, get } from '@nuxt/test-utils'

describe('with function on top level', () => {
  setupTest({
    server: true,
    fixture: 'fixture/with-function-top-level'
  })

  test('render', async () => {
    const { body } = await get('/robots.txt')
    expect(body).toBe('User-agent: Googlebot\nDisallow: /')
  })
})
