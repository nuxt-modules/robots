import NuxtRobots from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    NuxtRobots,
  ],
  site: {
    url: 'https://nuxtseo.com',
  },
  nitro: {
    // Without a date, Nitro picks the legacy Cloudflare preset. That preset writes no `_headers` file.
    compatibilityDate: '2025-07-15',
    prerender: {
      // A static file. A static host serves it without running the server.
      routes: ['/api/data.json'],
    },
  },
})
