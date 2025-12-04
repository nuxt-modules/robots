import NuxtRobots from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    NuxtRobots,
  ],
  robots: {
    enabled: false,
  },
  site: {
    url: 'https://example.com',
  },
})
