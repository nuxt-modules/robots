import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    'nuxt-simple-robots',
  ],
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
      ]
    }
  },
  robots: {
    indexable: true,
    disallow: '/hidden/',
    sitemap: 'https://example.com/sitemap.xml'
  },
  routeRules: {
    '/secret': {
      index: false
    },
  }
})
