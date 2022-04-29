import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  modules: [
    '../../../src/module.ts'
  ],
  robots: () => {
    return {
      UserAgent: 'Googlebot',
      Disallow: () => '/'
    }
  }
})
