import { defineNuxtConfig } from 'nuxt'
import RobotsModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    RobotsModule
  ],

  robots: {
    rules: {
      UserAgent: false,
      Disallow: false
    }
  }
})
