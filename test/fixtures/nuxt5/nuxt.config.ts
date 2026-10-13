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
    groups: [{ userAgent: '*', contentSignal: 'ai-train=no, search=yes' }],
  },
  routeRules: {
    '/private': {
      robots: false,
    },
    '/explicit-header': {
      headers: { 'x-robots-tag': 'noindex, noarchive', 'CONTENT-SIGNAL': 'search=no' },
    },
  },
  compatibilityDate: '2026-10-06',
})
