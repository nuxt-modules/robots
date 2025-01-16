import NuxteRobots from '../../../src/module'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: [
    NuxteRobots,
    '@nuxt/content',
  ],

  site: {
    url: 'https://nuxtseo.com',
  },

  alias: {
    '@nuxt/content': '@nuxt/content-v2',
  },

  debug: process.env.NODE_ENV === 'test',
  compatibilityDate: '2024-12-18',
})
