import NuxteRobots from '../../../src/module'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: [
    NuxteRobots,
    '@nuxtjs/i18n',
  ],

  site: {
    url: 'https://nuxtseo.com',
  },
  nitro: {
    prerender: {
      failOnError: false,
      ignore: ['/'],
    },
  },

  i18n: {
    baseUrl: 'https://nuxtseo.com',
    defaultLocale: 'en',
    strategy: 'prefix',
    locales: [
      {
        code: 'en',
        language: 'en-US',
      },
      {
        code: 'es',
        language: 'es-ES',
      },
      {
        code: 'fr',
        language: 'fr-FR',
      },
    ],
  },

  compatibilityDate: '2025-03-13',
})
