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
  compatibilityDate: '2026-10-06',
})
