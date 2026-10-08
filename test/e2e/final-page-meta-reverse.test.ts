import { createResolver } from '@nuxt/kit'
import { fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)
await setup({ rootDir: resolve('../fixtures/final-page-meta-reverse'), build: true, dev: false })

describe('page metadata with i18n installed before Robots', () => {
  it.each(['/de/hidden', '/de/nested/private', '/other/private'])('keeps private %s non-indexable', async (path) => {
    const response = await fetch(path)
    expect(response.status).toBe(200)
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect(await response.text()).toContain('<meta name="robots" content="noindex, nofollow">')
  })
  it.each(['/de/nested', '/de/nested/public', '/other'])('keeps public %s indexable', async (path) => {
    const response = await fetch(path)
    expect(response.status).toBe(200)
    expect(response.headers.get('x-robots-tag')).not.toContain('noindex')
    expect(await response.text()).toContain('Public')
  })
})
