import Robots from '../../../src/module'

export default defineNuxtConfig({
  modules: [Robots, '@nuxtjs/i18n'],
  site: { url: 'https://example.com' },
  future: { compatibilityVersion: 5 },
  // i18n still imports server utilities from #imports under Nuxt 5 compatibility.
  experimental: { nitroAutoImports: true },
  router: { options: { sensitive: false } },
  robots: { robotsTxt: false },
  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    detectBrowserLanguage: false,
    experimental: { compactRoutes: true },
    locales: [{ code: 'en', language: 'en-US' }, { code: 'de', language: 'de-DE' }],
  },
})
