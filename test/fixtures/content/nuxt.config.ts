import NuxtSimpleSitemap from '../../../src/module'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: [
    NuxtSimpleSitemap,
    '@nuxt/content',
  ],
  site: {
    url: 'https://nuxtseo.com',
  },
  sitemap: {
    autoLastmod: false,
    credits: false,
    debug: true,
  },
  debug: process.env.NODE_ENV === 'test',
})
