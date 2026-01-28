import { defineNuxtConfig } from 'nuxt/config'
import NuxtRobots from '../src/module'

export default defineNuxtConfig({
  modules: [
    NuxtRobots,
    // To develop the devtools client UI, run `pnpm client:dev` in a separate terminal
  ],

  content: false,

  site: {
    url: 'https://nuxtseo.com/',
  },

  nitro: {
    plugins: ['plugins/robots.ts'],
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
      ],
      ignore: ['/admin'],
    },
  },

  routeRules: {
    '/**/account': {
      robots: false,
      // index: false,
    },
    '/sub/:name': { robots: false },
    '/spa': { ssr: false },
  },

  experimental: {
    inlineRouteRules: true,
  },

  robots: {
    debug: true,
    // disallow: ['/'],
    sitemap: [
      '/sitemap.xml',
      '/sitemap.xml',
    ],
  },

  hooks: {
    'robots:config': function (robotsConfig) {
      robotsConfig.sitemap.push('/sitemap.xml')
    },
  },

  compatibilityDate: '2025-01-01',
})
