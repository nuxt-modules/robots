import { resolve } from 'pathe'

export default defineNuxtConfig({
  extends: ['nuxtseo-layer-devtools'],

  robots: false,

  nitro: {
    output: {
      publicDir: resolve(__dirname, '../dist/devtools'),
    },
    prerender: {
      routes: ['/', '/debug', '/docs'],
    },
  },

  imports: {
    autoImport: true,
  },

  app: {
    baseURL: '/__nuxt-robots',
  },
})
