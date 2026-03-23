import { resolve } from 'pathe'

export default defineNuxtConfig({
  extends: ['nuxtseo-shared/layer-devtools'],

  robots: false,

  nitro: {
    output: {
      publicDir: resolve(__dirname, '../dist/client'),
    },
  },

  app: {
    baseURL: '/__nuxt-robots',
  },
})
