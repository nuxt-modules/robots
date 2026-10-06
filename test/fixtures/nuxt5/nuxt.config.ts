import NuxtSeoShared from 'nuxtseo-shared'
import NuxtSiteConfig from 'nuxt-site-config'
import NuxtRobots from '@nuxtjs/robots'

// Stable support excludes prereleases. This fixture enables only its pinned nightly.
for (const module of [NuxtRobots, NuxtSiteConfig, NuxtSeoShared]) {
  const meta = await module.getMeta?.()
  if (!meta)
    throw new Error('Fixture module metadata unavailable')
  meta.compatibility = { ...meta.compatibility, nuxt: '^4.6.0 || ^5.0.0 || 5.0.0-2610052343-36eafab' }
}

export default defineNuxtConfig({
  modules: [NuxtRobots],
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
    '/spa': { ssr: false, robots: false },
    '/private': {
      robots: false,
    },
  },
  nitro: { prerender: { routes: ['/spa'] } },
  compatibilityDate: '2026-10-06',
})
