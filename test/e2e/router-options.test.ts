import { request } from 'node:http'
import { createResolver } from '@nuxt/kit'
import { fetch, setup, url } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)
await setup({
  rootDir: resolve('../fixtures/router-options'),
  build: true,
  dev: false,
  nuxtConfig: {
    app: { baseURL: '/app/' },
    future: { compatibilityVersion: 5 },
    router: { options: { strict: true } },
  },
})

describe('page robots respects the app router', () => {
  it('matches private pages under the app base', async () => {
    const response = await fetch('/app/private/42')
    expect(response.status).toBe(200)
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
  })
  it.each(['/app/PRIVATE/42', '/app/private/42/'])('does not apply private metadata to unmatched %s', async (path) => {
    const response = await fetch(path)
    expect(response.status).toBe(404)
    const config = await (await fetch(`/app/api/router-check?path=${encodeURIComponent(path.replace('/app', ''))}`)).json()
    expect(config.indexable).toBe(true)
  })
  it('keeps simultaneous production and staging pages isolated', async () => {
    const hosts = Array.from({ length: 8 }, (_, i) => i % 2 ? 'example.com' : 'site-staging.example.com')
    const responses = await Promise.all(hosts.map(host => new Promise<{ status: number | undefined, robots: string | string[] | undefined, body: string }>((resolve, reject) => {
      request(url('/app/'), { headers: { host } }, (res) => {
        const chunks: Buffer[] = []
        res.on('data', chunk => chunks.push(chunk))
        res.on('end', () => resolve({ status: res.statusCode, robots: res.headers['x-robots-tag'], body: Buffer.concat(chunks).toString() }))
      }).on('error', reject).end()
    })))
    responses.forEach((response, i) => {
      expect(response.status).toBe(200)
      if (hosts[i]!.startsWith('site-staging.')) {
        expect(response.robots).toBe('noindex, nofollow')
        expect(response.body).toContain('<meta name="robots" content="noindex, nofollow">')
      }
      else {
        expect(response.robots).not.toContain('noindex')
        expect(response.body).not.toContain('<meta name="robots" content="noindex')
      }
    })
  })
})
