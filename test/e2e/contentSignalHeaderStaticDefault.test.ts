import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils/e2e'
import { expect, it } from 'vitest'
import { readHeadersFile, staticAssetHeaders } from './utils/headers'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../fixtures/content-signal-headers'),
  build: true,
  server: false,
})

it('preserves authored rules without publishing the default policy to Cloudflare', () => {
  const markdown = staticAssetHeaders(readHeadersFile(), '/docs/policy.md')
  expect(markdown.get('content-signal')).toBeNull()
  expect(markdown.get('x-frame-options')).toBe('DENY')
})
