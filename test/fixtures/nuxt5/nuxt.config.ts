import NuxtRobots from '@nuxtjs/robots'
import NuxtSiteConfig from 'nuxt-site-config'
import NuxtSeoShared from 'nuxtseo-shared'

// Stable support excludes prereleases. This fixture enables only its pinned nightly.
for (const module of [NuxtRobots, NuxtSiteConfig, NuxtSeoShared]) {
  const meta = await module.getMeta?.()
  if (!meta)
    throw new Error('Fixture module metadata unavailable')
  meta.compatibility = { ...meta.compatibility, nuxt: '^4.6.0 || ^5.0.0 || 5.0.0-2610061032-c7ad8cd' }
}

export default defineNuxtConfig({
  workspaceDir: import.meta.dirname,
  vite: { resolve: { dedupe: ['nuxt', 'vue', 'vue-router'] } },
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
