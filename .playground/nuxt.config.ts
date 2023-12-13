import { defineNuxtConfig } from 'nuxt/config'
import Module from '../src/module'

export default defineNuxtConfig({
  modules: [
    Module,
  ],
  site: {
    url: 'https://nuxtseo.com/',
  },
  nitro: {
    typescript: {
      internalPaths: true,
    },
    plugins: ['plugins/robots.ts'],
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
      ],
    },
  },
  routeRules: {
    '/**/account': {
      index: false,
    },
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
})
