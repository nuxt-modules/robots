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
    disallow: '/hidden/',
    sitemap: 'https://example.com/sitemap.xml'
  },
  routeRules: {
    '/secret': {
      index: false
    },
  }
})
