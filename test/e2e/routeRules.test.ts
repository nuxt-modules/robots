import { createResolver } from '@nuxt/kit'
import { setup } from '@nuxt/test-utils'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

process.env.NODE_ENV = 'production'
await setup({
  rootDir: resolve('../../.playground'),
  build: true,
  server: true,
  nuxtConfig: {
    robots: {
      disallowNonIndexableRoutes: true,
    },
    routeRules: {
      '/index-rule/*': {
        robots: false,
      } as any,
      '/robots-rule/*': {
        robots: 'noindex',
      } as any,
      '/secret/**': {
        // index: false,
        robots: 'noindex, nofollow',
      } as any,
      '/secret/visible': {
        // index: true,
        robots: 'index, follow',
      } as any,
      '/excluded/*': {
        robots: false,
      } as any,
    },
  },
})

describe('route rule merging', () => {
  it('basic', async () => {
    const robotsTxt = await $fetch('/robots.txt')
    expect(robotsTxt).toMatchInlineSnapshot(`
      "# START nuxt-robots (indexable)
      User-agent: *
      Allow: /secret/exception
      Disallow: /secret
      Disallow: /admin
      Disallow: /*/hidden
      Disallow: /users/*/hidden
      Disallow: /?a=
      Disallow: /visible?*a=
      Disallow: /*/account
      Disallow: /sub/*
      Disallow: /index-rule/*
      Disallow: /robots-rule/*
      Disallow: /secret/*
      Disallow: /excluded/*
      Disallow: /_nuxt
      Disallow: /_nuxt/*

      Sitemap: https://nuxtseo.com/sitemap.xml
      # END nuxt-robots"
    `)
    expect(robotsTxt).toContain('Disallow: /index-rule/*')
    expect(robotsTxt).toContain('Disallow: /robots-rule/*')
  })
})
