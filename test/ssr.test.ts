import { setupTest, get } from '@nuxt/test-utils'

describe('ssr', () => {
  setupTest({
    server: true,
    fixture: 'fixture/ssr'
  })

  test('render', async () => {
    const { body } = await get('/robots.txt')
    expect(body).toBe('User-agent: *\nDisallow: ')
  })
})
