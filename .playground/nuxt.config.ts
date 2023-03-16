import { defineNuxtConfig } from 'nuxt/config'
import { resolve } from 'pathe'

export default defineNuxtConfig({
  alias: {
    'nuxt-simple-robots': resolve(__dirname, '../src/module'),
  },
  modules: [
    'nuxt-simple-robots',
  ],
  nitro: {
    plugins: ['plugins/robots.ts'],
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
      ]
    }
  },
  runtimeConfig: {
    siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://example.com',
  },
  robots: {
    indexable: true,
    disallow: '/hidden/',
    sitemap: '/sitemap.xml'
  },
  routeRules: {
    '/secret/**': {
      // index: false,
      robots: 'noindex, nofollow'
    },
    '/secret/visible': {
      // index: true,
      robots: 'index, follow',
    }
  }
})
