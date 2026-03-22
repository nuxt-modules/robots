import NuxtRobots from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    NuxtRobots,
    '@nuxt/content',
  ],

  site: {
    url: 'https://nuxtseo.com',
  },
  compatibilityDate: '2024-12-06',
})
