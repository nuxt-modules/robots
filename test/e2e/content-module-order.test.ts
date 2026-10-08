import { createResolver } from '@nuxt/kit'
import { fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'
import Robots from '../../src/module'

const { resolve } = createResolver(import.meta.url)
await setup({ rootDir: resolve('../fixtures/content-v3'), dev: false, build: true, nuxtConfig: { modules: ['@nuxt/content', Robots] } })
describe('content before Robots', () => {
  it('maps false frontmatter into noindex metadata', async () => {
    expect(await (await fetch('/foo')).text()).toContain('<meta name="robots" content="noindex, nofollow">')
  })
})
