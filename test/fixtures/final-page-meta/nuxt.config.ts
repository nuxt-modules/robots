import Robots from '../../../src/module'

export default defineNuxtConfig({
  modules: [Robots, '@nuxtjs/i18n'],
  site: { url: 'https://example.com' },
  future: { compatibilityVersion: 5 },
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
