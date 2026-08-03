import NuxtRobots from '@nuxtjs/robots'

export default defineNuxtConfig({
  modules: [NuxtRobots],
  site: {
    url: 'https://nuxt5.example.com',
  },
  robots: {
    credits: false,
    debug: true,
  },
  routeRules: {
    '/private': {
      robots: false,
    },
  },
  compatibilityDate: '2026-06-10',
})
