import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  modules: [
    '../../../src/module.ts'
  ],
  robots: {
    UserAgent: () => ['Googlebot', 'Bingbot'],
    Disallow: '"/admin"'
  }
})
