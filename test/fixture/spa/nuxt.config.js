import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  ssr: false,
  target: 'static',
  modules: [
    '../../../src/module'
  ]
})
