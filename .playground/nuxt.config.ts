import { defineNuxtConfig } from 'nuxt/config'
import Module from '../src/module'

export default defineNuxtConfig({
  modules: [
    Module,
  ],
  site: {
    url: 'https://nuxtseo.com/',
  },
  nitro: {
    plugins: ['plugins/robots.ts'],
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
      ]
    }
  },
  robots: {
    debug: true,
  },
})
