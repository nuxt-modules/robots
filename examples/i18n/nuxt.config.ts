export default defineNuxtConfig({
  modules: ['@nuxtjs/robots', '@nuxtjs/i18n'],

  site: {
    url: 'https://example.com',
  },

  i18n: {
    locales: [
      { code: 'en', name: 'English' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
    ],
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
  },

  compatibilityDate: '2025-01-01',
})
