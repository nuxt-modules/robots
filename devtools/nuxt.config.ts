import { resolve } from 'pathe'

export default defineNuxtConfig({
  extends: ['nuxtseo-layer-devtools'],

  robots: false,
  content: false,

  nitro: {
    prerender: {
      routes: ['/', '/debug', '/docs'],
    },
    output: {
      publicDir: resolve(__dirname, '../dist/devtools'),
    },
  },

  app: {
    baseURL: '/__nuxt-robots',
  },
})
