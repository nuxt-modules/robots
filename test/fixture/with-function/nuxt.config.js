import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  modules: [
    ['../../../src/module.ts', () => ({
      UserAgent: 'Googlebot',
      Disallow: () => '/'
    })]
  ]
})
