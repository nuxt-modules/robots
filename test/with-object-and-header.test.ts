import { setupTest, get } from '@nuxt/test-utils'

describe('with function', () => {
  setupTest({
    server: true,
    fixture: 'fixture/with-object-and-header'
  })

  test('render', async () => {
    const { body } = await get('/robots.txt')
    expect(body).toBe('# Comment\nUser-agent: Googlebot\nDisallow: /')
  })
})
