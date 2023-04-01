import { defineNuxtConfig } from 'nuxt/config'
import Module from '../src/module'

export default defineNuxtConfig({
  modules: [
    Module,
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
    disallow: '/hidden/',
    sitemap: '/sitemap.xml',
  },
  routeRules: {
    '/secret/**': {
      // index: false,
      robots: 'noindex, nofollow'
    },
    '/secret/visible': {
      // index: true,
      robots: 'index, follow',
    },
    '/excluded/*': {
      index: false,
    }
  }
})
