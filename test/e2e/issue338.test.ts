import { request } from 'node:http'
import { createResolver } from '@nuxt/kit'
import { fetch, setup, url } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)
await setup({ rootDir: resolve('../fixtures/issue338'), build: true, dev: false })
async function hostFetch(path: string, host: string): Promise<Response> {
  return await new Promise((resolve, reject) => {
    request(url(path), { headers: { host } }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve(new Response(Buffer.concat(chunks), { status: res.statusCode, headers: res.headers as any })))
    }).on('error', reject).end()
  })
}
describe('issue 338 production indexing', () => {
  it.each(['/hidden', '/users/123', '/users/456?foo=1'])('applies page metadata at %s', async (path) => {
    expect((await fetch(path)).headers.get('x-robots-tag')).toBe('noindex, nofollow')
  })
  it.each(['/private/123', '/optional', '/optional/123', '/nested'])('keeps native page matching at %s', async (path) => {
    expect((await fetch(path)).headers.get('x-robots-tag')).toBe('noindex, nofollow')
  })
  it.each(['/private/settings', '/private/not-a-number', '/public-child', '/authored'])('keeps public routes indexable at %s', async (path) => {
    expect((await fetch(path)).headers.get('x-robots-tag')).not.toContain('noindex')
  })
  it('preserves defaults for null Content-like inputs', async () => {
    const response = await fetch('/null')
    expect(response.status).toBe(200)
    expect(response.headers.get('x-robots-tag')).toContain('index, follow')
  })
  it('merges app assets and keeps build assets and noai paths crawlable', async () => {
    const txt = await (await fetch('/robots.txt')).text()
    expect(txt).toContain('Disallow: /from-app-assets')
    expect(txt).toContain('Disallow: /secret/*')
    expect(txt).not.toContain('Disallow: /_nuxt')
    expect(txt).not.toContain('Disallow: /ai')
  })
  it('isolates hook robots.txt groups across hosts and page requests', async () => {
    expect((await hostFetch('/', 'example.com')).headers.get('x-robots-tag')).not.toContain('noindex')
    const staging = await (await hostFetch('/robots.txt', 'staging.example.com')).text()
    expect(staging).toContain('Disallow: /\n')
    expect(staging).toContain('(indexing disabled)')
    expect((await hostFetch('/', 'example.com')).headers.get('x-robots-tag')).not.toContain('noindex')
  })
  it('applies host Site Config to pages without a robots.txt request', async () => {
    const staging = await hostFetch('/', 'site-staging.example.com')
    expect(staging.status).toBe(200)
    expect(staging.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect(await staging.text()).toContain('<meta name="robots" content="noindex, nofollow">')
    const production = await hostFetch('/', 'example.com')
    expect(production.status).toBe(200)
    expect(production.headers.get('x-robots-tag')).not.toContain('noindex')
  })
  it('uses public server aliases for site and page checks', async () => {
    const response = await fetch('/api/robots-check')
    expect(response.status).toBe(200)
    const result = await response.json()
    expect(result.site.indexable).toBe(true)
    expect(result.page.indexable).toBe(false)
  })
  it('does not claim production is development', async () => {
    const debug = await (await fetch('/__robots__/debug.json')).json()
    expect(debug.hints.join(' ')).not.toContain('blocked in development')
  })
})
