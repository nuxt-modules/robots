import { describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils'
import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

await setup({
  rootDir: resolve('../.playground'),
  build: true,
  server: true,
  nuxtConfig: {
    robots: {
      disallowNonIndexableRoutes: true,
    },
    routeRules: {
      '/index-rule/*': {
        index: false,
      },
      '/robots-rule/*': {
        robots: 'noindex',
      },
      '/secret/**': {
        // index: false,
        robots: 'noindex, nofollow',
      },
      '/secret/visible': {
        // index: true,
        robots: 'index, follow',
      },
      '/excluded/*': {
        index: false,
      },
    },
  },
})

describe('route rule merging', () => {
  it('basic', async () => {
    const robotsTxt = await $fetch('/robots.txt')
    expect(robotsTxt).toContain('Disallow: /index-rule/*')
    expect(robotsTxt).toContain('Disallow: /robots-rule/*')
    expect(robotsTxt).toMatchInlineSnapshot(`
      "# START nuxt-robots (indexable)
      User-agent: *
      Allow: /secret/exception
      Disallow: /secret
      Disallow: /admin
      Disallow: /*/account
      Disallow: /sub/*
      Disallow: /index-rule/*
      Disallow: /robots-rule/*
      Disallow: /secret/*
      Disallow: /excluded/*

      Sitemap: https://nuxtseo.com/sitemap.xml
      # END nuxt-robots"
    `)
  })
})
