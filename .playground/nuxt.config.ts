import { resolve } from 'pathe'
import { defineNuxtConfig } from 'nuxt/config'

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
    sitemap: 'https://example.com/sitemap.xml'
  },
  routeRules: {
    '/secret': { index: false },
  }
})
