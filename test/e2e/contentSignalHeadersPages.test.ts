import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils/e2e'
import { expect, it } from 'vitest'
import { readHeadersFile, staticAssetHeaders } from './utils/headers'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../fixtures/content-signal-headers'),
  build: true,
  server: false,
  nuxtConfig: { nitro: { preset: 'cloudflare-pages' } },
})

it('preserves the asset-root headers and policy on Cloudflare Pages', () => {
  const contents = readHeadersFile('')
  const markdownHeaders = staticAssetHeaders(contents, '/docs/policy.md')
  expect(markdownHeaders.get('x-frame-options')).toBe('DENY')
  expect(markdownHeaders.get('content-signal')).toBe('ai-train=no, search=yes')
  const removedPolicyHeaders = staticAssetHeaders(contents, '/docs/removed/page')
  expect(removedPolicyHeaders.get('x-frame-options')).toBe('DENY')
  expect(removedPolicyHeaders.get('content-signal')).toBeNull()
  expect(staticAssetHeaders(contents, '/docs/api/data.json').get('content-signal')).toBe('search=no')
})
