import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  modules: [
    ['../../../src/module', () => ({
      UserAgent: 'Googlebot',
      Disallow: () => '/'
    })]
  ]
})
