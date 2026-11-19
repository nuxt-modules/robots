import { defineNuxtConfig } from 'nuxt/config'

// Consumers can configure robots rules through Nuxt's public configuration API.
defineNuxtConfig({
  routeRules: {
    '/blocked': { robots: false },

    '/directives': {
      robots: { 'index': false, 'max-snippet': 120 },
    },
  },
})

defineNuxtConfig({
  routeRules: {
    '/invalid': {
      // @ts-expect-error Robots directives require a boolean or directive value.
      robots: 123,
    },
  },
})
