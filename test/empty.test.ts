import { setupTest, get } from '@nuxt/test-utils'

describe('empty', () => {
  setupTest({
    server: true,
    fixture: 'fixture/empty'
  })

  test('render', async () => {
    const { body } = await get('/robots.txt')
    expect(body).toBe('')
  })
})
