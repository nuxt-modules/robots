import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  modules: [
    '../../../src/module'
  ],
  robots: [
    {
      UserAgent: ['Googlebot', () => 'Bingbot'],
      Disallow: '/admin'
    }
  ]
})
