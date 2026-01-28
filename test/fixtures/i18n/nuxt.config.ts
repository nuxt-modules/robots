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

  // @ts-expect-error untyped
  i18n: {
    baseUrl: 'https://nuxtseo.com',
    defaultLocale: 'en',
    strategy: 'prefix',
    customRoutes: 'config',
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
    pages: {
      'route-rules-custom-path': {
        en: '/other',
        fr: '/autre',
      },
    },
  },

  experimental: {
    inlineRouteRules: true,
  },

  compatibilityDate: '2025-03-13',
})
