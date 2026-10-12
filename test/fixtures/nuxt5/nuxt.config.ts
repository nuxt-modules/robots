import NuxtRobots from '@nuxtjs/robots'
import NuxtSiteConfig from 'nuxt-site-config'

export default defineNuxtConfig({
  workspaceDir: import.meta.dirname,
  vite: { resolve: { dedupe: ['nuxt', 'vue', 'vue-router'] } },
  modules: [NuxtSiteConfig, NuxtRobots],
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
  compatibilityDate: '2026-10-06',
})
