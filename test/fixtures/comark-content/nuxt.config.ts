import NuxtRobots from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    NuxtRobots,
    '@harlan-zw/comark-content',
  ],

  site: {
    url: 'https://nuxtseo.com',
  },

  compatibilityDate: '2024-12-06',
})
