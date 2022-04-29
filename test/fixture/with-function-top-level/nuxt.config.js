import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  modules: [
    '../../../src/module'
  ],
  robots: () => {
    return {
      UserAgent: 'Googlebot',
      Disallow: () => '/'
    }
  }
})
