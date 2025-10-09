import NuxteRobots from '../../../src/module'

export default defineNuxtConfig({
  modules: [NuxteRobots],
  compatibilityDate: '2024-04-03',
  site: {
    url: 'https://example.com',
  },
  nitro: {
    plugins: ['~/server/plugins/robots.ts'],
  },
})
