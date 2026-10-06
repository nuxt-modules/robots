import NuxtRobots from '@nuxtjs/robots'

export default defineNuxtConfig({
  future: { compatibilityVersion: process.env.NUXT_TEST_FUTURE === '5' ? 5 : 4 },
  modules: [NuxtRobots],
  site: {
    url: 'https://nuxt5.example.com',
  },
  robots: {
    credits: false,
    debug: true,
  },
  routeRules: {
    '/spa': { ssr: false, robots: false },
    '/private': {
      robots: false,
    },
  },
  nitro: { prerender: { routes: ['/spa'] } },
  compatibilityDate: '2026-10-06',
})
