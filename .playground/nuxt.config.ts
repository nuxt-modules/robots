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
