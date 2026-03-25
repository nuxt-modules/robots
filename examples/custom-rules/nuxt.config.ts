export default defineNuxtConfig({
  modules: ['@nuxtjs/robots'],

  site: {
    url: 'https://example.com',
  },

  robots: {
    groups: [
      {
        userAgent: ['Googlebot'],
        allow: ['/'],
        disallow: ['/admin'],
      },
      {
        userAgent: ['*'],
        disallow: ['/private', '/admin', '/api'],
      },
    ],
  },

  compatibilityDate: '2025-01-01',
})
