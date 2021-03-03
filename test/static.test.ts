import { setupTest, get } from '@nuxt/test-utils'

describe('static', () => {
  setupTest({
    server: true,
    fixture: 'fixture/static'
  })

  test('render', async () => {
    const { body } = await get('/robots.txt')
    expect(body).toBe('Disallow: /foo\nUser-agent: *\nDisallow: ')
  })
})
