import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  modules: [
    ['../../../src/module.ts', {
      UserAgent: false,
      Disallow: false
    }]
  ]
})
