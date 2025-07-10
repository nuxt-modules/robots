import { createResolver } from '@nuxt/kit'
import { fetch, setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'
await setup({
  rootDir: resolve('../../.playground'),
  build: true,
  server: true,
  nuxtConfig: {
    routeRules: {
      '/ai-blocked': {
        robots: { noai: true },
      } as any,
      '/images-ai-blocked': {
        robots: { noimageai: true },
      } as any,
      '/custom-rule': {
        robots: { noindex: true, noai: true },
      } as any,
      '/ai-blocked-string': {
        robots: 'noai',
      } as any,
    },
  },
})

describe('noai and noimageai directives', () => {
  it('should apply noai directive via route rules', async () => {
    const aiBlockedPage = await $fetch('/ai-blocked', {
      headers: {
        Accept: 'text/html',
      },
    })
    expect(aiBlockedPage).toContain('<meta name="robots" content="noai"')
  })

  it('should apply noimageai directive via route rules', async () => {
    const imagesAiBlockedPage = await $fetch('/images-ai-blocked', {
      headers: {
        Accept: 'text/html',
      },
    })
    expect(imagesAiBlockedPage).toContain('<meta name="robots" content="noimageai"')
  })

  it('should apply custom combined rules using object syntax', async () => {
    const customRulePage = await $fetch('/custom-rule', {
      headers: {
        Accept: 'text/html',
      },
    })
    expect(customRulePage).toContain('<meta name="robots" content="noindex, noai"')
  })

  it('should support string syntax for noai directive', async () => {
    const aiBlockedStringPage = await $fetch('/ai-blocked-string', {
      headers: {
        Accept: 'text/html',
      },
    })
    expect(aiBlockedStringPage).toContain('<meta name="robots" content="noai"')
  })

  it('should send X-Robots-Tag header with noai directive', async () => {
    const response = await fetch('/ai-blocked')
    const headers = response.headers
    expect(headers.get('x-robots-tag')).toBe('noai')
  })

  it('should send X-Robots-Tag header with noimageai directive', async () => {
    const response = await fetch('/images-ai-blocked')
    const headers = response.headers
    expect(headers.get('x-robots-tag')).toBe('noimageai')
  })
})
