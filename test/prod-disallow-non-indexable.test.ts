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
      indexable: true,
      siteUrl: 'https://nuxt-simple-robots.com',
      disallowNonIndexableRoutes: true,
    },
    routeRules: {
      '/index-rule/*': {
        index: false,
      },
      '/robots-rule/*': {
        robots: 'noindex',
      },
    },
  },
})

describe('prod-disallow-non-indexable', () => {
  it('basic', async () => {
    const robotsTxt = await $fetch('/robots.txt')
    expect(robotsTxt).toContain('Disallow: /index-rule/*')
    expect(robotsTxt).toContain('Disallow: /robots-rule/*')
    expect(robotsTxt).toMatchInlineSnapshot(`
      "# START nuxt-simple-robots (indexable: true)
      User-agent: *
      Disallow: /hidden/
      Disallow: /secret/*
      Disallow: /excluded/*
      Disallow: /index-rule/*
      Disallow: /robots-rule/*

      Sitemap: https://nuxt-simple-robots.com/sitemap.xml
      # END nuxt-simple-robots"
    `)
  }, 60000)
})
