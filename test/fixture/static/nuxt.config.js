import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  target: 'static',
  modules: [
    '../../../src/module.ts'
  ]
})
