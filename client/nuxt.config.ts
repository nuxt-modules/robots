import { resolve } from 'pathe'

export default defineNuxtConfig({
  modules: [
    '@nuxt/fonts',
    '@nuxt/ui',
  ],
  ssr: false,

  content: false,
  robots: false,
  devtools: false,

  app: {
    baseURL: '/__nuxt-robots',
  },

  css: ['~/assets/css/global.css'],

  compatibilityDate: '2025-03-13',

  nitro: {
    output: {
      publicDir: resolve(__dirname, '../dist/client'),
    },
  },

  routeRules: {
    '/**': {
      headers: {
        'x-frame-options': 'SAMEORIGIN',
      },
    },
  },

  fonts: {
    families: [
      { name: 'Hubot Sans' },
    ],
  },

  vite: {
    optimizeDeps: {
      include: [
        'shiki/core',
        'shiki/engine/javascript',
        '@shikijs/themes/vitesse-light',
        '@shikijs/themes/vitesse-dark',
        '@shikijs/langs/json',
        '@shikijs/langs/html',
        '@shikijs/langs/bash',
        '@vueuse/core',
        '@nuxt/devtools-kit/iframe-client',
      ],
    },
  },
})
