import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'
import { readHeadersFile } from './utils/headers'

const { resolve } = createResolver(import.meta.url)

await setup({ rootDir: resolve('../fixtures/content-signal-budget'), build: true, server: false })

describe('content-Signal header budget', () => {
  it('allows a later compiler to trim optional rules before checking the final budget', () => {
    const contents = readHeadersFile()
    expect(contents.split('\n').filter(line => /^[^\s#]/.test(line))).toHaveLength(100)
    expect(contents).toContain('Content-Signal: ai-train=no')
  })
})
