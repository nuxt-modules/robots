import NuxtRobots from '@nuxtjs/robots'

export default defineNuxtConfig({
  future: { compatibilityVersion: process.env.NUXT_TEST_FUTURE === '5' ? 5 : 4 },
  modules: [NuxtRobots, (_options, nuxt) => {
    nuxt.hook('nitro:config', (config) => {
      config.routeRules ||= {}
      config.routeRules['/late'] = { robots: false }
    })
  }],
  site: {
    url: 'https://nuxt5.example.com',
  },
  robots: {
    enabled: process.env.NUXT_ROBOTS_MODE !== 'disabled',
    botDetection: process.env.NUXT_ROBOTS_MODE !== 'bot-disabled',
    credits: false,
    debug: true,
  },
  routeRules: {
    '/slash/': { robots: false },
    '/spa': { ssr: false, robots: false },
    '/private': {
      robots: false,
    },
  },
  nitro: { prerender: { routes: ['/static-ssr', '/spa'] } },
  compatibilityDate: '2026-10-06',
})
