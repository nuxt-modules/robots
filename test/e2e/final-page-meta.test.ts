import { createResolver } from '@nuxt/kit'
import { fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)
await setup({ rootDir: resolve('../fixtures/final-page-meta'), build: true, dev: false })

describe('final page metadata after route transforms', () => {
  it.each(['/hidden', '/de/hidden', '/de/HIDDEN', '/de/nested/private', '/other/private', '/other/alias'])('keeps private %s non-indexable', async (path) => {
    const response = await fetch(path)
    expect(response.status).toBe(200)
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect(await response.text()).toContain('<meta name="robots" content="noindex, nofollow">')
  })
  it.each(['/nested', '/de/nested', '/nested/public', '/de/nested/public', '/other', '/other/public'])('keeps public %s indexable', async (path) => {
    const response = await fetch(path)
    expect(response.status).toBe(200)
    expect(response.headers.get('x-robots-tag')).not.toContain('noindex')
    expect(await response.text()).toContain('Public')
  })
})
