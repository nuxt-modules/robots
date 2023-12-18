import NuxtSimpleRobots from '../../../src/module'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: [
    NuxtSimpleRobots,
    '@nuxt/content',
  ],
  site: {
    url: 'https://nuxtseo.com',
  },
  debug: process.env.NODE_ENV === 'test',
})
