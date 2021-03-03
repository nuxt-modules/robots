import { setupTest, get } from '@nuxt/test-utils'

describe('spa', () => {
  setupTest({
    server: true,
    fixture: 'fixture/spa'
  })

  test('render', async () => {
    const { body } = await get('/robots.txt')
    expect(body).toBe('User-agent: *\nDisallow: ')
  })
})
