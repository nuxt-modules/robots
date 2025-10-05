import DevtoolsUIKit from '@nuxt/devtools-ui-kit'
import { resolve } from 'pathe'

export default defineNuxtConfig({
  ssr: false,

  modules: [
    DevtoolsUIKit,
  ],

  devtools: {
    enabled: false,
  },

  robots: {
    enabled: false,
  },

  nitro: {
    output: {
      publicDir: resolve(__dirname, '../dist/client'),
    },
  },

  app: {
    baseURL: '/__nuxt-robots',
  },

  compatibilityDate: '2025-03-13',
})
